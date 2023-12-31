import styles from "antd/dist/reset.css";
import { Space, DatePicker, Button } from "antd";
import { Form, Link, useSearchParams, useActionData } from "@remix-run/react";
// const style:React.CSSProperties={backgroundColor:"#1677ff"}

import styleUrl from "~/styles/login.css";
import { LinksFunction, ActionArgs, redirect, V2_MetaFunction } from "@remix-run/node";

import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { createUserSeccion, login, register } from "~/utils/session.server";
import { useState } from "react";
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styleUrl },
];

export const meta:V2_MetaFunction=()=>{
  const description=
  "Login to submit your own jokes to Remix Jokes:";
  return[
    {name:"description", content: description},
    {name:"twitter:description", content:"description"},
    {title:"Remix Jokes | Login"},
  ]
}
//validationfunction
function validateUsername(username: string) {
  if (username.length < 3) {
    return "Usernames must be at least 3 characters long";
  }
}
// validate password
function validatePassword(password: string) {
  if (password.length < 6) {
    return "Passwords must be at least 6 characters Long";
  }
}

// validate url
function validateUrl(url: string) {
  const urls = ["/jokes", "/", "https://remix.run"];
  if (urls.includes(url)) {
    return url;
  }
  return "/jokes";
}

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData();
  // const loginType = form.get("loginType");
  const password = form.get("password");
  const username = form.get("username");
  const redirectTo = validateUrl(
    (form.get("redirectTo") as string) || "/jokes"
  );
  if (
    // typeof loginType !== "string" ||
    typeof password !== "string" ||
    typeof username !== "string"
  ) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: "Form not submitted correctly",
    });
  }

  const fields = { password, username };
  const fieldErrors = {
    password: validatePassword(password),
    username: validateUsername(username),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
      formError: null,
    });
  }
  // switch (loginType) {
  // case "login": {
  const user = await login({ username, password });
  console.log({ user });
  if (!user) {
    return badRequest({
      fieldErrors: null,
      fields,
      formError: "Username/Password combination is incorrect",
    });
  }
  return createUserSeccion(user.id, redirectTo);
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [SearchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  return (
    <>
      <div className="container">
        <div className="content" data-light="">
          <h1>Login</h1>
          <Form method="post">
            <input
              type="hidden"
              name="redirectTo"
              value={SearchParams.get("redirectTo") ?? undefined}
            />
            <fieldset>
              {/* <legend className="sr-only">Login Or Register</legend>
              <label>
                <input
                  type="radio"
                  name="loginType"
                  value="login"
                  defaultChecked={
                    !actionData?.fields?.loginType ||
                    actionData?.fields?.loginType === "login"
                  }
                />{" "}
                Login
              </label> */}
              <label>
                {/* <input
                  type="radio"
                  name="loginType"
                  value="register"
                  defaultChecked={actionData?.fields?.loginType === "register"}
                />{" "} */}
                <Link to="/register" className="register-comp">
                  New User Register
                </Link>
              </label>
            </fieldset>
            <div>
              <label htmlFor="username-input">Username</label>
              <input
                type="text"
                name="username"
                id="username-input"
                defaultValue={actionData?.fields?.username}
                aria-invalid={Boolean(actionData?.fieldErrors?.username)}
                aria-errormessage={
                  actionData?.fieldErrors?.username
                    ? "username-error"
                    : undefined
                }
              />
              {actionData?.fieldErrors?.username ? (
                <p
                  className="form-validation-error"
                  role="alert"
                  id="username-error"
                >
                  {actionData.fieldErrors.username}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="password-input">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password-input"
                name="password"
                defaultValue={actionData?.fields?.password}
                aria-invalid={Boolean(actionData?.fieldErrors?.password)}
                aria-errormessage={
                  actionData?.fieldErrors?.password
                    ? "password-error"
                    : undefined
                }
              />
               <p onClick={toggleShowPassword}>
        {showPassword ? 'Hide Password' : 'Show Password'}
      </p>
              {actionData?.fieldErrors?.password ? (
                <p
                  className="form-validation-error"
                  role="alert"
                  id="password-error"
                >
                  {actionData.fieldErrors.password}
                </p>
              ) : null}
            </div>
            <div id="form-error-message">
              {actionData?.formError ? (
                <p className="form-validation-error" role="alert">
                  {actionData.formError}
                </p>
              ) : null}
            </div>
            <Link to="/forgetpassword" className="register-comp">
              Forgot password
            </Link>
            <button type="submit" className="button">
              Submit
            </button>
          </Form>
        </div>
        <div className="links">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/jokes">Jokes</Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
