import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        type: mongoose.ObjectId,
        ref: "Products",
        required: true,
      },
    ],
    payment: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
      required: true,
    },
    status: {
      type: String,
      default: "Not Processed",
      enum: ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"],
    },
  },
  { timestamps: true }
);

orderSchema.path('products').validate(function (array) {
  return array.length > 0;  // Ensure the array has at least one product
}, 'Order must contain at least one product.');

export default mongoose.model("Order", orderSchema);