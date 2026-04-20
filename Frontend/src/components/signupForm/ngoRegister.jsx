import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../signupForm/signup.css"

export default function NGORegister() {
  const [message, setMessage] = useState("");

  const validationSchema = Yup.object({
    Ngoname: Yup.string().required("NGO Name is required"),

    darpan_id: Yup.string().required("DARPAN ID is required"),

    year_established: Yup.number()
      .typeError("Year must be a number")
      .min(1800, "Year must be after 1800")
      .max(2100, "Year seems invalid")
      .required("Year of Establishment is required"),

    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),

    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),

    confirm_password: Yup.string()
      .required("Confirm your password")
      .oneOf([Yup.ref("password")], "Passwords do not match"),

    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Enter a valid 10-digit phone number")
      .required("Phone number is required"),

    address: Yup.string().required("Address is required"),

    account_holder_name: Yup.string().required("Account Holder Name is required"),

    account_number: Yup.string()
      .matches(/^[0-9]{8,18}$/, "Enter a valid account number")
      .required("Account Number is required"),

    ifsc: Yup.string()
      .matches(/^[A-Za-z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code")
      .required("IFSC Code is required"),
  });

  const initialValues = {
    Ngoname: "",
    darpan_id: "",
    year_established: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    address: "",
    account_holder_name: "",
    account_number: "",
    ifsc: "",
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const response = await fetch(`https://fsd-project-backend-2bms.onrender.com/api/ngo/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      console.log("received resp");

      if (response.ok) {
        setMessage("Registration successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
        resetForm();
      } else {
        setMessage("Registration failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again later.");
    }

    setSubmitting(false);
  };

  return (
    <div className="container">
      <h1>NGO Registration</h1>

      {message && (
        <div
          style={{
            backgroundColor: "#eef",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "6px",
            color: message.includes("success") ? "green" : "red",
            fontWeight: "bold",
          }}
        >
          {message}
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <Form id="ngo_form">
          <h2>NGO Details</h2>

          <label>NGO Name</label>
          <Field type="text" name="Ngoname" />
          <ErrorMessage name="Ngoname" component="div" className="error" />

          <label>DARPAN ID</label>
          <Field type="text" name="darpan_id" />
          <ErrorMessage name="darpan_id" component="div" className="error" />

          <label>Year of Establishment</label>
          <Field type="number" name="year_established" />
          <ErrorMessage name="year_established" component="div" className="error" />

          <h2>Contact Information</h2>

          <label>Email</label>
          <Field type="email" name="email" />
          <ErrorMessage name="email" component="div" className="error" />

          <label>Password</label>
          <Field type="password" name="password" />
          <ErrorMessage name="password" component="div" className="error" />

          <label>Confirm Password</label>
          <Field type="password" name="confirm_password" />
          <ErrorMessage name="confirm_password" component="div" className="error" />

          <label>Phone Number</label>
          <Field type="text" name="phone" />
          <ErrorMessage name="phone" component="div" className="error" />

          <label>Address</label>
          <Field as="textarea" name="address" />
          <ErrorMessage name="address" component="div" className="error" />

          <h2>Bank & Payment Details</h2>

          <label>Bank Account Holder Name</label>
          <Field type="text" name="account_holder_name" />
          <ErrorMessage name="account_holder_name" component="div" className="error" />

          <label>Account Number</label>
          <Field type="text" name="account_number" />
          <ErrorMessage name="account_number" component="div" className="error" />

          <label>IFSC Code</label>
          <Field type="text" name="ifsc" />
          <ErrorMessage name="ifsc" component="div" className="error" />

          <button type="submit" style={{ marginTop: "20px" }}>
            Register
          </button>
        </Form>
      </Formik>
    </div>
  );
}
