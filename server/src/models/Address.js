import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Address = sequelize.define(
  "Address",
  {
    street: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: "India",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "addresses",
  }
);

// Associations
export const associateAddress = (models) => {
  Address.belongsTo(models.User, { foreignKey: "userId" });
};
