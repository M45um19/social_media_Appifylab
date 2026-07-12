"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegister } from "../hooks/use-auth";
import { registerSchema } from "../types/auth.types";
import { ZodError } from "zod";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: true, // Default to true as in HTML checked attribute
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const registerMutation = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" || type === "radio" ? checked : value,
    }));
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Validate input data using Zod
      const validatedData = registerSchema.parse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        agreeTerms: formData.agreeTerms,
      });

      // Submit data via mutation hook
      registerMutation.mutate(validatedData, {
        onSuccess: (data) => {
          if (data.success) {
            setSuccessMessage(data.message || "Registration successful!");
            setFormData({
              firstName: "",
              lastName: "",
              email: "",
              password: "",
              confirmPassword: "",
              agreeTerms: true,
            });
            router.push("/");
          } else {
            setErrorMessage(data.message || "Registration failed. Please try again.");
          }
        },
        onError: (err) => {
          const axiosError = err as {
            response?: {
              data?: {
                message?: string;
              };
            };
            message?: string;
          };
          setErrorMessage(
            axiosError.response?.data?.message ||
              axiosError.message ||
              "Registration failed. Please try again."
          );
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
      }
    }
  };

  return (
    <section className="_social_registration_wrapper _layout_main_wrapper">
      
      {/* Decorative Background Shapes */}
      <div className="_shape_one">
        <img src="/assets/images/shape1.svg" alt="" className="_shape_img" />
        <img src="/assets/images/dark_shape.svg" alt="" className="_dark_shape" />
      </div>
      <div className="_shape_two">
        <img src="/assets/images/shape2.svg" alt="" className="_shape_img" />
        <img src="/assets/images/dark_shape1.svg" alt="" className="_dark_shape _dark_shape_opacity" />
      </div>
      <div className="_shape_three">
        <img src="/assets/images/shape3.svg" alt="" className="_shape_img" />
        <img src="/assets/images/dark_shape2.svg" alt="" className="_dark_shape _dark_shape_opacity" />
      </div>

      <div className="_social_registration_wrap">
        <div className="container">
          <div className="row align-items-center">
            
            {/* Visual Side Banner (Left) */}
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_registration_right">
                <div className="_social_registration_right_image">
                  <img src="/assets/images/registration.png" alt="Registration Visual" />
                </div>
                <div className="_social_registration_right_image_dark">
                  <img src="/assets/images/registration1.png" alt="Registration Visual Dark" />
                </div>
              </div>
            </div>

            {/* Registration Form Box (Right) */}
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_registration_content">
                
                {/* Logo & Subtitles */}
                <div className="_social_registration_right_logo _mar_b28">
                  <img src="/assets/images/logo.svg" alt="Buddy Script Logo" className="_right_logo" />
                </div>
                <p className="_social_registration_content_para _mar_b8">Get Started Now</p>
                <h4 className="_social_registration_content_title _title4 _mar_b50">Registration</h4>

                {/* OAuth Registration */}
                <button type="button" className="_social_registration_content_btn _mar_b40" onClick={() => alert("Google registration coming soon!")}>
                  <img src="/assets/images/google.svg" alt="Google Logo" className="_google_img" /> 
                  <span>Register with google</span>
                </button>

                <div className="_social_registration_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>

                {/* Mutation Feedback Alerts */}
                {successMessage && (
                  <div className="alert alert-success p-2 mb-3 text-center" style={{ fontSize: "14px", borderRadius: "6px" }}>
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="alert alert-danger p-2 mb-3 text-center" style={{ fontSize: "14px", borderRadius: "6px" }}>
                    {errorMessage}
                  </div>
                )}

                {/* Form Registration */}
                <form className="_social_registration_form" onSubmit={handleSubmit}>
                  <div className="row">

                    {/* First Name Input */}
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`form-control _social_registration_input ${validationErrors.firstName ? "is-invalid" : ""}`}
                          placeholder="John"
                        />
                        {validationErrors.firstName && (
                          <div className="text-danger mt-1 small" style={{ fontSize: "12px", textAlign: "left" }}>
                            {validationErrors.firstName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Last Name Input */}
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`form-control _social_registration_input ${validationErrors.lastName ? "is-invalid" : ""}`}
                          placeholder="Doe"
                        />
                        {validationErrors.lastName && (
                          <div className="text-danger mt-1 small" style={{ fontSize: "12px", textAlign: "left" }}>
                            {validationErrors.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Email Input */}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`form-control _social_registration_input ${validationErrors.email ? "is-invalid" : ""}`}
                          placeholder="name@example.com"
                        />
                        {validationErrors.email && (
                          <div className="text-danger mt-1 small" style={{ fontSize: "12px", textAlign: "left" }}>
                            {validationErrors.email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Password</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`form-control _social_registration_input ${validationErrors.password ? "is-invalid" : ""}`}
                          placeholder="••••••••"
                        />
                        {validationErrors.password && (
                          <div className="text-danger mt-1 small" style={{ fontSize: "12px", textAlign: "left" }}>
                            {validationErrors.password}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Repeat Password Input */}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Repeat Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`form-control _social_registration_input ${validationErrors.confirmPassword ? "is-invalid" : ""}`}
                          placeholder="••••••••"
                        />
                        {validationErrors.confirmPassword && (
                          <div className="text-danger mt-1 small" style={{ fontSize: "12px", textAlign: "left" }}>
                            {validationErrors.confirmPassword}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="row">
                    <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                      <div className="form-check _social_registration_form_check">
                        <input
                          className="form-check-input _social_registration_form_check_input"
                          type="checkbox"
                          name="agreeTerms"
                          id="agreeTermsCheckbox"
                          checked={formData.agreeTerms}
                          onChange={handleChange}
                        />
                        <label className="form-check-label _social_registration_form_check_label" htmlFor="agreeTermsCheckbox">
                          I agree to terms & conditions
                        </label>
                      </div>
                      {validationErrors.agreeTerms && (
                        <div className="text-danger mt-1 small" style={{ fontSize: "12px", textAlign: "left" }}>
                          {validationErrors.agreeTerms}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Submission Button */}
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                      <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                        <button
                          type="submit"
                          className="_social_registration_form_btn_link _btn1"
                          disabled={registerMutation.isPending}
                          style={{
                            opacity: registerMutation.isPending ? 0.7 : 1,
                            cursor: registerMutation.isPending ? "not-allowed" : "pointer",
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            paddingLeft: "24px",
                            paddingRight: "24px",
                          }}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              <span>Registering...</span>
                            </>
                          ) : (
                            <span>Register Now</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                </form>

                {/* Redirect/Alternate Action link */}
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_registration_bottom_txt">
                      <p className="_social_registration_bottom_txt_para">
                        Already have an account? <Link href="/login">Login now</Link>
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
