const redisClient = require("../redis");

const OTP_EMAIL_COOLDOWN_SECONDS = Number(
  process.env.OTP_EMAIL_COOLDOWN_SECONDS || 60
);

const OTP_CIRCUIT_FAILURE_THRESHOLD = Number(
  process.env.OTP_CIRCUIT_FAILURE_THRESHOLD || 3
);

const OTP_CIRCUIT_RESET_SECONDS = Number(
  process.env.OTP_CIRCUIT_RESET_SECONDS || 300
);

const OTP_COOLDOWN_PREFIX = "careconnect:otp:cooldown:";
const OTP_CIRCUIT_STATE_KEY = "careconnect:otp:circuit:state";
const OTP_CIRCUIT_FAILURES_KEY = "careconnect:otp:circuit:failures";

const getCooldownKey = (email) => {
  return `${OTP_COOLDOWN_PREFIX}${email.toLowerCase().trim()}`;
};

const isRedisAvailable = () => {
  return redisClient.isReadyStatus === true && redisClient.isReady === true;
};

/**
 * Reserve an OTP email slot for a user.
 *
 * NX makes this atomic:
 * if two login requests arrive at the same time,
 * only one of them gets the slot.
 */
const reserveOTPSend = async (email) => {
  if (!isRedisAvailable()) {
    return {
      allowed: true,
      redisUnavailable: true,
    };
  }

  const key = getCooldownKey(email);

  const result = await redisClient.set(key, "1", {
    NX: true,
    EX: OTP_EMAIL_COOLDOWN_SECONDS,
  });

  if (result === null) {
    return {
      allowed: false,
      redisUnavailable: false,
    };
  }

  return {
    allowed: true,
    redisUnavailable: false,
  };
};

/**
 * If EmailJS fails, release the cooldown so the user
 * can retry instead of being locked out for the whole
 * cooldown period.
 */
const releaseOTPSend = async (email) => {
  if (!isRedisAvailable()) {
    return;
  }

  const key = getCooldownKey(email);

  try {
    await redisClient.del(key);
  } catch (err) {
    console.error("Failed to release OTP cooldown:", err.message);
  }
};

const getCircuitState = async () => {
  if (!isRedisAvailable()) {
    return "CLOSED";
  }

  const state = await redisClient.get(OTP_CIRCUIT_STATE_KEY);

  if (!state) {
    return "CLOSED";
  }

  return state;
};

const getFailureCount = async () => {
  if (!isRedisAvailable()) {
    return 0;
  }

  const failures = await redisClient.get(OTP_CIRCUIT_FAILURES_KEY);

  return failures ? Number(failures) : 0;
};

/**
 * Check whether the OTP email circuit is currently open.
 *
 * If the circuit has been open for the reset period,
 * move it to HALF_OPEN so the next email request can
 * test EmailJS again.
 */
const canAttemptEmail = async () => {
  if (!isRedisAvailable()) {
    return {
      allowed: true,
      state: "CLOSED",
    };
  }

  let state = await getCircuitState();

  if (state === "OPEN") {
    const ttl = await redisClient.ttl(OTP_CIRCUIT_STATE_KEY);

    if (ttl <= 0) {
      await redisClient.set(OTP_CIRCUIT_STATE_KEY, "HALF_OPEN", {
        EX: OTP_CIRCUIT_RESET_SECONDS,
      });

      state = "HALF_OPEN";
    } else {
      return {
        allowed: false,
        state: "OPEN",
      };
    }
  }

  return {
    allowed: true,
    state,
  };
};

/**
 * Call this after a successful EmailJS request.
 *
 * Successful email delivery closes the circuit and
 * clears the failure counter.
 */
const recordEmailSuccess = async () => {
  if (!isRedisAvailable()) {
    return;
  }

  try {
    await redisClient.del(OTP_CIRCUIT_FAILURES_KEY);

    await redisClient.set(OTP_CIRCUIT_STATE_KEY, "CLOSED");
  } catch (err) {
    console.error("Failed to reset OTP circuit:", err.message);
  }
};

/**
 * Classify EmailJS errors.
 *
 * Quota/rate-limit errors immediately open the circuit.
 * Other provider failures require several consecutive
 * failures before opening it.
 */
const recordEmailFailure = async (error) => {
  if (!isRedisAvailable()) {
    return {
      circuitOpened: false,
      failureCount: 0,
    };
  }

  try {
    const errorMessage = String(error?.message || "").toLowerCase();

    const isQuotaError =
      errorMessage.includes("quota") ||
      errorMessage.includes("limit exceeded") ||
      errorMessage.includes("monthly limit") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many requests");

    if (isQuotaError) {
      await redisClient.set(OTP_CIRCUIT_STATE_KEY, "OPEN", {
        EX: OTP_CIRCUIT_RESET_SECONDS,
      });

      await redisClient.set(OTP_CIRCUIT_FAILURES_KEY, "0", {
        EX: OTP_CIRCUIT_RESET_SECONDS,
      });

      console.error(
        "🚨 OTP circuit OPENED because EmailJS reported a quota/rate-limit condition."
      );

      return {
        circuitOpened: true,
        failureCount: 0,
      };
    }

    const failures = await redisClient.incr(OTP_CIRCUIT_FAILURES_KEY);

    await redisClient.expire(
      OTP_CIRCUIT_FAILURES_KEY,
      OTP_CIRCUIT_RESET_SECONDS
    );

    if (failures >= OTP_CIRCUIT_FAILURE_THRESHOLD) {
      await redisClient.set(OTP_CIRCUIT_STATE_KEY, "OPEN", {
        EX: OTP_CIRCUIT_RESET_SECONDS,
      });

      console.error(
        `🚨 OTP circuit OPENED after ${failures} consecutive EmailJS failures.`
      );

      return {
        circuitOpened: true,
        failureCount: failures,
      };
    }

    return {
      circuitOpened: false,
      failureCount: failures,
    };
  } catch (err) {
    console.error("Failed to update OTP circuit:", err.message);

    return {
      circuitOpened: false,
      failureCount: 0,
    };
  }
};

const shouldFallbackToPassword = async () => {
  const fallbackEnabled =
    process.env.OTP_FALLBACK_ENABLED === "true";

  if (!fallbackEnabled) {
    return false;
  }

  const state = await getCircuitState();

  return state === "OPEN";
};

module.exports = {
  reserveOTPSend,
  releaseOTPSend,
  canAttemptEmail,
  recordEmailSuccess,
  recordEmailFailure,
  shouldFallbackToPassword,
  getCircuitState,
  getFailureCount,
};