import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../api";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(`${API_URL}token/`, {
        username,
        password,
      });
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      console.log("Login successful:", response.data);
      navigate("/");
    } catch (err) {
      if (err.response && err.response.data) {
        setError(
          err.response.data.detail ||
            "Login failed. Please check your credentials."
        );
      } else {
        setError("Login failed. Please try again later.");
      }
      console.error("Login error:", err);
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
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={styles.input}
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
                  />
                </div>
                <button type="submit" style={styles.loginButton}>
                  Log In
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
};

export default Login;
