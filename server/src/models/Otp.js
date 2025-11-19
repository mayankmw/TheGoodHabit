import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Otp = sequelize.define("Otp", {
  email: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false }
});
