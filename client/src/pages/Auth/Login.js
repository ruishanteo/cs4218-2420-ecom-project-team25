import React, { useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";
import { useAuth } from "../../context/auth";
import { isEmail } from "validator";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [auth, setAuth] = useAuth();

	const navigate = useNavigate();
	const location = useLocation();

	// form function
	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			if (!email.trim()) {
				toast.error("Email is required!");
				return;
			}

			// Email format validation using regex
			if (isEmail(email) === false) {
				toast.error("Please enter a valid email address");
				return;
			}

			if (!password.trim()) {
				toast.error("Password is required!");
				return;
			}

			const res = await axios.post("/api/v1/auth/login", {
				email,
				password,
			});
			if (res?.data?.success) {
				toast.success(res.data.message, {
					duration: 5000,
					icon: "🙏",
					style: {
						background: "green",
						color: "white",
					},
				});
				setAuth({
					...auth,
					user: res.data.user,
					token: res.data.token,
				});
				localStorage.setItem("auth", JSON.stringify(res.data));
				navigate(location.state || "/");
			} else {
				toast.error(res.data.message);
			}
		} catch (error) {
			console.log(error);
			if (error.response?.data?.message === "Incorrect password or email") {
				toast.error("Incorrect password or email");
			} else {
				toast.error("Something went wrong");
			}
		}
	};
	return (
		<Layout title="Login - Ecommerce App">
			<div className="form-container " style={{ minHeight: "90vh" }}>
				<form onSubmit={handleSubmit}>
					<h4 className="title">LOGIN FORM</h4>

					<div className="mb-3">
						<input
							autoFocus
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="form-control"
							id="exampleInputEmail1"
							placeholder="Enter Your Email"
						/>
					</div>
					<div className="mb-3">
						<input
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="form-control"
							id="exampleInputPassword1"
							placeholder="Enter Your Password"
						/>
					</div>
					<div className="mb-3">
						<button
							type="button"
							className="btn forgot-btn"
							onClick={() => {
								navigate("/forgot-password");
							}}
						>
							Forgot Password
						</button>
					</div>

					<button type="submit" className="btn btn-primary">
						LOGIN
					</button>
				</form>
			</div>
		</Layout>
	);
};

export default Login;
