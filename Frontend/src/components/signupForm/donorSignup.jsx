import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../signupForm/signup.css"

export default function DonorSignup() {
    const [message, setMessage] = useState("");

    const validationSchema = Yup.object({
        fullname: Yup.string().required("Name is required"),

        mail: Yup.string()
            .email("Invalid email")
            .required("Email is required"),

        phone: Yup.string()
            .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
            .required("Phone number is required"),

        password: Yup.string()
            .min(6, "Password must be at least 6 characters")
            .required("Password is required"),

        repass: Yup.string()
            .oneOf([Yup.ref("password")], "Passwords do not match")
            .required("Confirm Password is required"),

        checkbox: Yup.boolean(),
    });

    const initialValues = {
        fullname: "",
        mail: "",
        phone: "",
        password: "",
        repass: "",
        checkbox: false,
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            const response = await fetch(`https://fsd-project-backend-2bms.onrender.com/api/signup`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (data.success) {
                setMessage("Signup successful! Redirecting...");

                setTimeout(() => {
                    window.location.href = "/login";
                }, 1000);

                resetForm();
            } else {
                setMessage(data.message || "Signup failed");
            }

        } catch (error) {
            console.error("Signup error:", error);
            setMessage("Server error. Please try again later.");
        }

        setSubmitting(false);
    };



    return (
        <div className="container">
            <h1>Donor Signup</h1>

            {message && (
                <div
                    style={{
                        margin: "20px auto",
                        borderRadius: "8px",
                        backgroundColor: "rgb(181, 242, 203)",
                        color: "rgb(161, 37, 9)",
                        textAlign: "center",
                        width: "300px",
                        padding: "10px",
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
                <Form name="myForm">

                    <label htmlFor="fullname">Name</label>
                    <Field type="text" id="fullname" name="fullname" placeholder="Enter your fullname" />
                    <ErrorMessage name="fullname" component="div" className="error" />

                    <br /><br />

                    <label htmlFor="mail">Email</label>
                    <Field type="email" id="mail" name="mail" placeholder="Enter your email" />
                    <ErrorMessage name="mail" component="div" className="error" />

                    <br /><br />

                    <label htmlFor="phone">Phone</label>
                    <Field type="text" id="phone" name="phone" placeholder="Enter your phone number" />
                    <ErrorMessage name="phone" component="div" className="error" />

                    <br /><br />

                    <label htmlFor="pass">Password</label>
                    <Field type="password" id="pass" name="password" placeholder="Enter your password" />
                    <ErrorMessage name="password" component="div" className="error" />

                    <br /><br />

                    <label htmlFor="repass">Confirm Password</label>
                    <Field type="password" id="repass" name="repass" placeholder="Confirm your password" />
                    <ErrorMessage name="repass" component="div" className="error" />

                    <br /><br />

                    <div className="checkbox-container">
                        <Field type="checkbox" name="checkbox" id="checkbox" />
                        <label htmlFor="checkbox">I agree to receive notifications</label>
                    </div>

                    <ErrorMessage name="checkbox" component="div" className="error" />

                    <br /><br />

                    <button type="submit">Sign-Up</button>
                </Form>
            </Formik>
        </div>
    );
}
