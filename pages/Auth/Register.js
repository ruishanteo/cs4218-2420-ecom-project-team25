import React, { useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";
import { isEmail } from "validator";

const Register = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [DOB, setDOB] = useState("");
	const [answer, setAnswer] = useState("");
	const navigate = useNavigate();

	// form function
	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Name is required!");
			return;
		}

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

		if (!phone.trim()) {
			toast.error("Phone is required!");
			return;
		}

		if (!address.trim()) {
			toast.error("Address is required!");
			return;
		}

		if (!DOB) {
			toast.error("Date of Birth is required!");
			return;
		}

		if (!answer.trim()) {
			toast.error("Answer is required!");
			return;
		}

		try {
			const res = await axios.post("/api/v1/auth/register", {
				name,
				email,
				password,
				phone,
				address,
				DOB,
				answer,
			});
			if (res?.data?.success) {
				toast.success("Register Successfully, please login");
				navigate("/login");
			} else {
				toast.error(res.data.message);
			}
		} catch (error) {
			console.log(error);
			toast.error("Something went wrong");
		}
	};

	return (
		<Layout title="Register - Ecommerce App">
			<div className="form-container" style={{ minHeight: "90vh" }}>
				<form onSubmit={handleSubmit}>
					<h4 className="title">REGISTER FORM</h4>
					<div className="mb-3">
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="form-control"
							id="exampleInputName1"
							placeholder="Enter Your Name"
							autoFocus
						/>
					</div>
					<div className="mb-3">
						<input
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="form-control"
							id="exampleInputEmail1"
							placeholder="Enter Your Email "
						/>
					</div>
					<div className="mb-3">
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="form-control"
							id="exampleInputPassword1"
							placeholder="Enter Your Password"
						/>
					</div>
					<div className="mb-3">
						<input
							type="text"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							className="form-control"
							id="exampleInputPhone1"
							placeholder="Enter Your Phone"
						/>
					</div>
					<div className="mb-3">
						<input
							type="text"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							className="form-control"
							id="exampleInputaddress1"
							placeholder="Enter Your Address"
						/>
					</div>
					<div className="mb-3">
						<input
							type="Date"
							value={DOB}
							onChange={(e) => setDOB(e.target.value)}
							className="form-control"
							id="exampleInputDOB1"
							placeholder="Enter Your DOB"
						/>
					</div>
					<div className="mb-3">
						<input
							type="text"
							value={answer}
							onChange={(e) => setAnswer(e.target.value)}
							className="form-control"
							id="exampleInputanswer1"
							placeholder="What is Your Favorite sports"
						/>
					</div>
					<button type="submit" className="btn btn-primary">
						REGISTER
					</button>
				</form>
			</div>
		</Layout>
	);
};

export default Register;
