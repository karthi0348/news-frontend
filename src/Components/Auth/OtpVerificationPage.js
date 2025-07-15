import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../App"; // Import the useAuth hook

function OtpVerificationPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();

  // Get emailForOtp from the navigation state
  const emailForOtp = location.state?.emailForOtp;

  // Redirect if email is not available (e.g., direct access to this page)
  useEffect(() => {
    if (!emailForOtp) {
      setError("No email provided for OTP verification. Please log in again.");
      navigate("/login", { replace: true });
    }
  }, [emailForOtp, navigate]);

  // Timer for Resend OTP Button
  useEffect(() => {
    let timerInterval;
    if (resendTimer > 0 && !canResendOtp) {
      timerInterval = setInterval(() => {
        setResendTimer((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerInterval);
            setCanResendOtp(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [resendTimer, canResendOtp]);

  const startResendTimer = () => {
    setResendTimer(60);
    setCanResendOtp(false);
  };

  // Handle OTP Verification
  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setError("");
    setLoginMessage("");
    setIsSubmitting(true);

    if (!emailForOtp) {
      setError("Email is missing. Please return to the login page.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}verify-otp/`, {
        email: emailForOtp,
        otp_code: otp,
      });

      if (response.data && response.data.access) {
        login(response.data.access, response.data.refresh);
        setLoginMessage("Login successful!");

        console.log("OTP verification successful.");
        console.log("Access Token received:", response.data.access ? "Yes" : "No");
        console.log("Refresh Token received:", response.data.refresh ? "Yes" : "No");

        const redirectUrl = localStorage.getItem("redirect_after_login");
        if (redirectUrl) {
          localStorage.removeItem("redirect_after_login");
          navigate(redirectUrl);
        } else {
          navigate("/news");
        }
      } else if (response.status === 200 && response.data.detail === "Login successful.") {
        // If OTP verification itself is successful, but no tokens are returned,
        // it means the user is now "verified" but not "logged in" with tokens yet.
        // This implies the initial /login/ must be re-run to get tokens.
        // This is a common pattern when 2FA completes a "session" rather than issuing tokens directly.

        setLoginMessage("OTP verified. Please log in again to complete access.");
        // We cannot use the original password here as it's not stored in state.
        // The most robust way is to redirect back to login and let the user re-enter,
        // or for the backend to return tokens after OTP.
        // Given your previous code's "Option B," let's assume the backend will give tokens on a *subsequent* /login/.
        // However, a direct re-login with the original password is risky if the user navigates away or refreshes.
        // For a frontend-only fix without backend changes, we have to assume tokens *should* come after /verify-otp/.
        // If they don't, then the user *must* log in again from scratch.
        setError("OTP verified, but failed to obtain login tokens. Please log in again.");
        logout(); // Clear any partial auth state
        navigate("/login"); // Redirect to login page
      } else {
        setError(
          response.data.detail ||
            response.data.message ||
            "OTP verification failed. Please try again."
        );
        logout(); // Clear tokens if OTP fails
      }
    } catch (err) {
      if (err.response && err.response.data) {
        let errorMessage = "An error occurred. Please try again.";
        const errorData = err.response.data;

        if (typeof errorData === "object" && errorData !== null) {
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.non_field_errors) {
            errorMessage = errorData.non_field_errors.join(" ");
          } else {
            const fieldErrors = Object.keys(errorData)
              .map((key) => {
                if (Array.isArray(errorData[key])) {
                  return `${key}: ${errorData[key].join(", ")}`;
                }
                return `${key}: ${errorData[key]}`;
              })
              .join("; ");
            if (fieldErrors) {
              errorMessage = `Validation Error: ${fieldErrors}`;
            }
          }
        }
        setError(errorMessage);
      } else {
        setError("OTP verification failed. Please try again later.");
      }
      console.error("OTP verification error:", err);
      logout(); // Clear tokens on OTP verification error to force re-login
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    setError("");
    setLoginMessage("");
    setIsSubmitting(true);
    setCanResendOtp(false);

    if (!emailForOtp) {
      setError("Email is missing. Cannot resend OTP.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}resend-otp/`, {
        email: emailForOtp,
      });

      if (response.data && response.data.detail) {
        setLoginMessage(response.data.detail);
        startResendTimer();
      } else {
        setError(
          response.data.message || "Failed to resend OTP. Please try again."
        );
      }
    } catch (err) {
      if (err.response && err.response.data) {
        let errorMessage = "An error occurred. Please try again.";
        const errorData = err.response.data;

        if (typeof errorData === "object" && errorData !== null) {
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.non_field_errors) {
            errorMessage = errorData.non_field_errors.join(" ");
          } else {
            const fieldErrors = Object.keys(errorData)
              .map((key) => {
                if (Array.isArray(errorData[key])) {
                  return `${key}: ${errorData[key].join(", ")}`;
                }
                return `${key}: ${errorData[key]}`;
              })
              .join("; ");
            if (fieldErrors) {
              errorMessage = `Validation Error: ${fieldErrors}`;
            }
          }
        }
        setError(errorMessage);
      } else {
        setError(
          "An error occurred while resending OTP. Please try again later."
        );
      }
      console.error("Resend OTP error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!emailForOtp) {
    // Render nothing or a loading spinner while redirecting
    return null;
  }

  return (
    <div className="container pt-5">
      <div className="row">
        <div className="col-12 d-flex justify-content-center align-items-center">
          <div style={styles.background}>
            <div style={styles.containerself}>
              <h1 style={styles.heading}>Verify OTP</h1>
              {error && <p style={styles.error}>{error}</p>}
              {loginMessage && !error && (
                <p style={styles.successMessage}>{loginMessage}</p>
              )}

              <p style={styles.instructionText}>
                An OTP has been sent to **{emailForOtp}**. Please enter it below.
              </p>

              <form onSubmit={handleOtpVerification} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const re = /^[0-9\b]+$/;
                      if (e.target.value === "" || re.test(e.target.value)) {
                        setOtp(e.target.value);
                      }
                    }}
                    required
                    maxLength="6"
                    style={styles.input}
                    autoComplete="one-time-code"
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    ...styles.loginButton,
                    ...(isSubmitting
                      ? { opacity: 0.7, cursor: "not-allowed" }
                      : {}),
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Verifying..." : "Verify OTP"}
                </button>
              </form>

              <p
                style={{
                  ...styles.linkText,
                  marginTop: "15px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {resendTimer > 0 && !canResendOtp
                  ? `Resend OTP in ${resendTimer}s`
                  : ""}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResendOtp || isSubmitting}
                  style={{
                    ...styles.resendButton,
                    ...(!canResendOtp || isSubmitting
                      ? { opacity: 0.5, cursor: "not-allowed" }
                      : {}),
                  }}
                >
                  Resend OTP
                </button>
              </p>
              <p style={styles.linkText}>
                <Link to="/login" style={styles.link}>
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reuse the same styles from Login.js, adding any specific ones for OtpVerificationPage
const styles = {
  background: {
    width: "400px",
    height: "fit-content",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    borderRadius: "10px",
    color: "white",
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
  },
  containerself: {
    width: "fit-content",
    padding: "30px 20px",
    textAlign: "center",
  },
  heading: {
    color: "white",
    fontSize: "32px",
    fontWeight: "300",
    marginBottom: "40px",
    fontFamily: "Arial, sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
    marginBottom: "30px",
  },
  inputGroup: {
    textAlign: "left",
  },
  label: {
    color: "white",
    fontSize: "16px",
    fontWeight: "300",
    marginBottom: "10px",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "10px 0",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255, 255, 255, 0.7)",
    color: "white",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.3s ease",
  },
  loginButton: {
    background: "white",
    color: "#764ba2",
    border: "none",
    padding: "15px 30px",
    borderRadius: "25px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "20px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
  },
  resendButton: {
    background: "transparent",
    color: "white",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    padding: "8px 15px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "400",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginLeft: "10px",
  },
  linkText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "14px",
    fontWeight: "300",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
  },
  error: {
    color: "#ff6b6b",
    background: "rgba(255, 107, 107, 0.1)",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "14px",
    textAlign: "center",
    marginBottom: "20px",
    border: "1px solid rgba(255, 107, 107, 0.3)",
  },
  successMessage: {
    color: "#aaffaa",
    background: "rgba(170, 255, 170, 0.1)",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "14px",
    textAlign: "center",
    marginBottom: "20px",
    border: "1px solid rgba(170, 255, 170, 0.3)",
  },
  instructionText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "15px",
    marginBottom: "20px",
  },
};

export default OtpVerificationPage;