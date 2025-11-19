// models/Product.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Product = sequelize.define("Product", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  image: DataTypes.STRING,
  type: DataTypes.STRING,

  originalPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  discountedPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  rating: DataTypes.FLOAT,
  reviews: DataTypes.INTEGER,
  description: DataTypes.TEXT,
  
  ingredients: {
    type: DataTypes.JSON,
    defaultValue: [],
  }
});

