import bcrypt from "bcrypt";
import { User } from "../models/User.js";

export const seedDefaultUser = async () => {
  const email = "wadhwa.mayankreal9149@gmail.com";
  const password = "mayank@123";

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.log("Default user already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    email,
    password: hashedPassword
  });

  console.log("Default user created!");
};
