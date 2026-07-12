"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLogin } from "../hooks/use-auth";
import { loginSchema } from "../types/auth.types";
import { ZodError } from "zod";

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true, // Default to checked as in HTML
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useLogin();

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
      // Validate input data using Zod schema
      const validatedData = loginSchema.parse({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      // Submit data via mutation hook
      loginMutation.mutate(validatedData, {
        onSuccess: (data) => {
          if (data.success) {
            setSuccessMessage(data.message || "Logged in successfully!");

            setFormData({
              email: "",
              password: "",
              rememberMe: true,
            });
            router.push("/");
          } else {
            setErrorMessage(data.message || "Login failed. Please check your credentials.");
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
              "Login failed. Please check your credentials."
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
    <section className="_social_login_wrapper _layout_main_wrapper">
      
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

      <div className="_social_login_wrap">
        <div className="container">
          <div className="row align-items-center">
            
            {/* Visual Side Banner (Left) */}
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_login_left">
                <div className="_social_login_left_image">
                  <img src="/assets/images/login.png" alt="Login Graphic" className="_left_img" />
                </div>
              </div>
            </div>

            {/* Login Form Box (Right) */}
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_login_content">
                
                {/* Logo & Headings */}
                <div className="_social_login_left_logo _mar_b28">
                  <img src="/assets/images/logo.svg" alt="Logo" className="_left_logo" />
                </div>
                <p className="_social_login_content_para _mar_b8">Welcome back</p>
                <h4 className="_social_login_content_title _title4 _mar_b50">Login to your account</h4>

                {/* Google Sign-in Option */}
                <button type="button" className="_social_login_content_btn _mar_b40" onClick={() => alert("Google sign-in coming soon!")}>
                  <img src="/assets/images/google.svg" alt="Google Logo" className="_google_img" /> 
                  <span>Or sign-in with google</span>
                </button>

                <div className="_social_login_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>

                {/* Alert Response Banners */}
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

                {/* Login Form */}
                <form className="_social_login_form" onSubmit={handleSubmit}>
                  <div className="row">
                    
                    {/* Email Input */}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_login_form_input _mar_b14">
                        <label className="_social_login_label _mar_b8">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`form-control _social_login_input ${validationErrors.email ? "is-invalid" : ""}`}
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
                      <div className="_social_login_form_input _mar_b14">
                        <label className="_social_login_label _mar_b8">Password</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`form-control _social_login_input ${validationErrors.password ? "is-invalid" : ""}`}
                          placeholder="••••••••"
                        />
                        {validationErrors.password && (
                          <div className="text-danger mt-1 small" style={{ fontSize: "12px", textAlign: "left" }}>
                            {validationErrors.password}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Remember Me & Forgot Password Links */}
                  <div className="row">
                    <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                      <div className="form-check _social_login_form_check">
                        <input
                          className="form-check-input _social_login_form_check_input"
                          type="checkbox"
                          name="rememberMe"
                          id="rememberMeCheckbox"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                        />
                        <label className="form-check-label _social_login_form_check_label" htmlFor="rememberMeCheckbox">
                          Remember me
                        </label>
                      </div>
                    </div>
                    <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                      <div className="_social_login_form_left">
                        <p className="_social_login_form_left_para" style={{ cursor: "pointer" }} onClick={() => alert("Forgot password workflow coming soon!")}>
                          Forgot password?
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submission Button */}
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                      <div className="_social_login_form_btn _mar_t40 _mar_b60">
                        <button
                          type="submit"
                          className="_social_login_form_btn_link _btn1"
                          disabled={loginMutation.isPending}
                          style={{
                            opacity: loginMutation.isPending ? 0.7 : 1,
                            cursor: loginMutation.isPending ? "not-allowed" : "pointer",
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            paddingLeft: "24px",
                            paddingRight: "24px",
                          }}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              <span>Logging in...</span>
                            </>
                          ) : (
                            <span>Login now</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                </form>

                {/* Navigation Toggle to Registration */}
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_login_bottom_txt">
                      <p className="_social_login_bottom_txt_para">
                        Dont have an account? <Link href="/register">Create New Account</Link>
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
