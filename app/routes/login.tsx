import styles from "antd/dist/reset.css";
import { Space, DatePicker, Button } from "antd";
import { Form, Link, useSearchParams, useActionData } from "@remix-run/react";
// const style:React.CSSProperties={backgroundColor:"#1677ff"}

import styleUrl from "~/styles/login.css";
import { LinksFunction, ActionArgs, redirect } from "@remix-run/node";

import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { createUserSeccion, login, register } from "~/utils/session.server";
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styleUrl },
];

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
  const loginType = form.get("loginType");
  const password = form.get("password");
  const username = form.get("username");
  const redirectTo = validateUrl(
    (form.get("redirectTo") as string) || "/jokes"
  );
  if (
    typeof loginType !== "string" ||
    typeof password !== "string" ||
    typeof username !== "string"
  ) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: "Form not submitted correctly",
    });
  }

  const fields = { loginType, password, username };
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
  switch (loginType) {
    case "login": {
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

      // return badRequest({
      //   fieldErrors:null,
      //   fields,
      //   formError:"Not implemented",
      // })
    }
    case "register": {
      const userExists = await db.user.findFirst({
        where: { username },
      });
      if (userExists) {
        return badRequest({
          fieldErrors: null,
          fields,
          formError: `User with username ${username} already exists`,
        });
      }
      // create the user
      const user = await register({ username, password });
      if (!user) {
        return badRequest({
          fieldErrors: null,
          fields,
          formError: "Something went wrong trying to create a new user.",
        });
      }
      // create their session and redirect to /jokes
      return createUserSeccion(user.id, redirectTo);
    }
    // return redirect ("/")
    default: {
      return badRequest({
        fieldErrors: null,
        fields,
        formError: "login type invalid",
      });
    }
  }
  
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [SearchParams] = useSearchParams();
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
              <legend className="sr-only">Login Or Register</legend>
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
              </label>
              <label>
                <input
                  type="radio"
                  name="loginType"
                  value="register"
                  defaultChecked={actionData?.fields?.loginType === "register"}
                />{" "}
                Register
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
                type="password"
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