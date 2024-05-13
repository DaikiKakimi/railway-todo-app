import React from "react";
import { useCookies } from "react-cookie";
import { useSelector, useDispatch } from "react-redux/es/exports";
import { useHistory } from "react-router-dom";
import { signOut } from "../authSlice";
import "./header.scss";
import { Link } from "react-router-dom/cjs/react-router-dom.min";

export const Header = () => {
  const auth = useSelector((state) => state.auth.isSignIn);
  const dispatch = useDispatch();
  const history = useHistory();
  const [cookies, setCookie, removeCookie] = useCookies();
  const handleSignOut = () => {
    dispatch(signOut());
    removeCookie("token");
    history.push("/signin");
  };

  return (
    <header className="header">
      <Link className="title" to={"/"}>
        <h1>Todoアプリ</h1>
      </Link>
      {auth ? (
        <button onClick={handleSignOut} className="sign-out-button">
          サインアウト
        </button>
      ) : (
        <></>
      )}
    </header>
  );
};
