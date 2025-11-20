import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../signupForm/signup.css"

export default function CarehomeRegistration() {
  const [message, setMessage] = useState("");

  const validationSchema = Yup.object({
    care_home_name: Yup.string().required("Care Home Name is required"),
    reg_number: Yup.string().required("Govt ID is required"),
    email: Yup.string().email("Invalid email format").required("Email is required"),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
    contact: Yup.string()
      .matches(/^[0-9]{10}$/, "Enter a valid 10-digit phone number")
      .required("Contact number is required"),
    state: Yup.string().required("State is required"),
    city: Yup.string().required("City is required"),
    num_residents: Yup.number()
      .typeError("Enter a valid number")
      .min(10, "Residents must be at least 10")
      .required("Number of residents is required"),
    avg_expense: Yup.number()
      .typeError("Enter a valid amount")
      .required("Average monthly expense is required"),
    wishlist: Yup.string(),
    description: Yup.string(),
    account_holder: Yup.string().required("Account holder name is required"),
    account_number: Yup.string()
      .matches(/^[0-9]{8,18}$/, "Enter a valid account number")
      .required("Account Number is required"),
    ifsc: Yup.string()
      .matches(/^[A-Za-z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code")
      .required("IFSC Code is required"),
    terms: Yup.boolean().oneOf([true], "You must accept the Terms & Conditions"),
    image: Yup.mixed().required("Carehome image is required"),
  });

  const initialValues = {
    care_home_name: "",
    reg_number: "",
    email: "",
    password: "",
    contact: "",
    state: "",
    city: "",
    num_residents: "",
    avg_expense: "",
    wishlist: "",
    description: "",
    account_holder: "",
    account_number: "",
    ifsc: "",
    terms: false,
    image: null,
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData();

    Object.keys(values).forEach((key) => {
      if (key !== "image") {
        formData.append(key, values[key]);
      }
    });

    formData.append("image", values.image);

    formData.append("userRole", "Carehome");

    try {
      const response = await fetch("/registerCarehome", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setMessage("Registration successful! Redirecting...");
        setTimeout(() => (window.location.href = "/login"), 1000);
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
      <h2>Care Home Registration</h2>

      {message && (
        <div
          style={{
            background: "#eef",
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "6px",
            fontWeight: "bold",
            color: message.includes("successful") ? "green" : "red",
          }}
        >
          {message}
        </div>
      )}

      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ setFieldValue }) => (
          <Form id="registrationForm" encType="multipart/form-data">

            <label>Care Home Name</label>
            <Field type="text" name="care_home_name" />
            <ErrorMessage name="care_home_name" component="div" className="error" />

            <label>Govt. ID</label>
            <Field type="text" name="reg_number" placeholder="e.g. 123/2024" />
            <ErrorMessage name="reg_number" component="div" className="error" />

            <label>Email</label>
            <Field type="email" name="email" />
            <ErrorMessage name="email" component="div" className="error" />

            <label>Password</label>
            <Field type="password" name="password" />
            <ErrorMessage name="password" component="div" className="error" />

            <label>Contact Number</label>
            <Field type="text" name="contact" />
            <ErrorMessage name="contact" component="div" className="error" />

            <label>State</label>
            <Field type="text" name="state" />
            <ErrorMessage name="state" component="div" className="error" />

            <label>City</label>
            <Field type="text" name="city" />
            <ErrorMessage name="city" component="div" className="error" />

            <label>Number of Residents</label>
            <Field type="number" name="num_residents" />
            <ErrorMessage name="num_residents" component="div" className="error" />

            <label>Average Monthly Expense</label>
            <Field type="number" name="avg_expense" />
            <ErrorMessage name="avg_expense" component="div" className="error" />

            <label>Wishlist (Optional)</label>
            <Field as="textarea" name="wishlist" />
            <ErrorMessage name="wishlist" component="div" className="error" />

            <label>Description (Optional)</label>
            <Field as="textarea" name="description" />
            <ErrorMessage name="description" component="div" className="error" />

            <label>Account Holder Name</label>
            <Field type="text" name="account_holder" />
            <ErrorMessage name="account_holder" component="div" className="error" />

            <label>Account Number</label>
            <Field type="text" name="account_number" />
            <ErrorMessage name="account_number" component="div" className="error" />

            <label>IFSC Code</label>
            <Field type="text" name="ifsc" />
            <ErrorMessage name="ifsc" component="div" className="error" />

            <label>Carehome Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFieldValue("image", e.target.files[0])}
            />
            <ErrorMessage name="image" component="div" className="error" />

            <div className="checkbox-container">
              <Field type="checkbox" name="terms" id="terms" />
              <label htmlFor="terms">I agree to the Terms & Conditions</label>
            </div>

            <ErrorMessage name="terms" component="div" className="error" />

            <button type="submit" style={{ marginTop: "20px" }}>Register</button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
