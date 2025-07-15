import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../App"; // Import the useAuth hook

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // We only need login here

  // Handle Initial Login (Email/Password Submission)
  const handleInitialLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoginMessage("");
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}login/`, {
        email,
        password,
      });

      if (response.data && response.data.otp_required) {
        setLoginMessage(
          response.data.message ||
            "An OTP has been sent to your registered email. Please enter it to proceed."
        );
        // Navigate to the OTP verification page, passing the email
        navigate("/verify-otp", { state: { emailForOtp: email } });
      } else if (response.data && response.data.access) {
        // Direct login if no OTP is required
        login(response.data.access, response.data.refresh);
        console.log("Login successful (no OTP required):", response.data);

        const redirectUrl = localStorage.getItem("redirect_after_login");
        if (redirectUrl) {
          localStorage.removeItem("redirect_after_login");
          navigate(redirectUrl);
        } else {
          navigate("/news");
        }
      } else {
        setError(
          "Unexpected successful response from the server. Please try again."
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
          "Login failed. Please try again later. Network error or server unreachable."
        );
      }
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container pt-5">
      <div className="row">
        <div className="col-12 d-flex justify-content-center align-items-center">
          <div style={styles.background}>
            <div style={styles.containerself}>
              <h1 style={styles.heading}>Login</h1>
              {error && <p style={styles.error}>{error}</p>}
              {loginMessage && !error && (
                <p style={styles.successMessage}>{loginMessage}</p>
              )}

              <form onSubmit={handleInitialLogin} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.input}
                    autoComplete="email"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={styles.input}
                    autoComplete="current-password"
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
                  {isSubmitting ? "Logging in..." : "Log In"}
                </button>
              </form>

              <p style={styles.linkText}>
                Don't have an account?{" "}
                <Link to="/signup" style={styles.link}>
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
};

export default Login;