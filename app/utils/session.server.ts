import {
    createCookieSessionStorage, redirect
} from "@remix-run/node"
import bcrypt from "bcryptjs";
import {db} from "./db.server";
import { User } from "@prisma/client";

type RegisterForm={
    password: string;
    username:string;
    email:string;
    phone:string;
    passion:string;
}
type LoginForm={
    password: string;
    username:string;
};
type forgotData={
    email:string;
    password:string;
}

export async function register({
    password, 
    username,
    email,
    phone,
    passion,
}:RegisterForm){
   const passwordHash = await bcrypt.hash(password, 10);
   const user = await db.user.create({
    data:{passwordHash, username, email, phone, passion},
   });
   return { id: user.id, username}
}

async function updatePassword(email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.user.update({
      where: {
        email: email
      },
      data: {
        passwordHash: passwordHash
      }
    });
  }
  
  //forgotpassword
  export async function forgotPassword(email: string, newPassword: string) {
    // C user exists
    const user = await db.user.findUnique({
      where: {
        email: email
      }
    });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    // Update the user's password
    await updatePassword(email, newPassword);
  }






export async function login({
    password,
    username,
}:LoginForm){
    const user = await db.user.findUnique({
        where:{username},
    });
    if(!user){
        return null;
    }

    const  isCorrectPassword = await bcrypt.compare(
        password,
        user.passwordHash
    );
    if(!isCorrectPassword){
        return null;
    }
    return {id: user.id, username};
}
//process.env.SECTION_SECRET
const sessionSecret="kapil";
console.log("secion",sessionSecret);

if(!sessionSecret){
    throw new Error("SECTION_SECRET must be set");
}

const storage= createCookieSessionStorage({
    cookie:{
        name:"RJ_session",
        secure:process.env.NODE_ENV==="production",
        secrets:[sessionSecret],
        sameSite:"lax",
        path:"/",
        maxAge:60*60*24*30,
        httpOnly:true,
    }
});

function getUserSession(request: Request){
    return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request){
    const session = await getUserSession(request);
    const userId = session.get("userId");
    if(!userId || typeof userId !== "string"){
        return null;
    }
    return userId;
}
export async function requireUserId(
    request: Request,
    redirectTo:string=new URL(request.url).pathname
){
    const session = await getUserSession(request);
    const userId=session.get("userId");
    if(!userId || typeof userId !== "string"){
        const searchParams=new URLSearchParams([
            ["redirectTo", redirectTo],
        ]);
        throw redirect(`/login?${searchParams}`)
    }
    return userId
}
//logout
export async function getUser(request: Request){
    const userId=await getUserId(request);
    if(typeof userId !== "string"){
        return null
    }
    const user=await db.user.findUnique({
        select:{id:true, username:true,email:true,phone:true,passion:true},
        where:{id:userId},
    });
    if(!user){
        throw logout(request)
    }
    console.log("userid",userId);
    
    return user;
}
//update user
// export async function updateUser(request:Request){
//     const userId=await getUserId(request);
//     console.log("userNewid",userId);
//     if(typeof userId !== "string"){
//         return null
//     }
//     const user=await db.user.update({
//         where:{id:userId},
//         data: {email:""},
//     })
    
// }

export async function logout(request: Request){
    const session=await getUserSession(request);
    return redirect("/login",{
        headers:{
            "Set-Cookie": await storage.destroySession(session)
        },
    });
}

export async function createUserSeccion(
    userId:string,
    redirectTo:string
){
    const session = await storage.getSession();
    session.set("userId",userId);
    return redirect(redirectTo,{
        headers:{
            "Set-Cookie":await storage.commitSession(session),
        },
    });
}