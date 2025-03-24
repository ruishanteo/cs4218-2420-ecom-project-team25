import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";
import RedirectSpinner from "../RedirectSpinner";

export default function PrivateRoute() {
  const [isLoading, setIsLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [auth, setAuth] = useAuth();

  useEffect(() => {
    const authCheck = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get("/api/v1/auth/user-auth");
        setIsLoading(false);

        if (res.data.ok) {
          setOk(true);
        } else {
          setAuth({
            user: null,
            token: "",
          });
          localStorage.removeItem("auth");
          setOk(false);
        }
      } catch (err) {
        localStorage.removeItem("auth");
        setAuth({
          user: null,
          token: "",
        });
        setOk(false);
        setIsLoading(false);
        console.log(err);
      }
    };
    if (auth?.token) authCheck();
  }, [auth?.token, setAuth]);

  if (isLoading) {
    return <Spinner />;
  }

  return ok ? <Outlet /> : <RedirectSpinner />;
}
