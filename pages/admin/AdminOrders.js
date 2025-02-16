import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminMenu from "../../components/AdminMenu";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/auth";
import moment from "moment";
import { Select } from "antd";
const { Option } = Select;

export const ADMIN_ORDERS_STRINGS = {
  FETCH_ORDERS_ERROR: "Something went wrong while fetching orders",
  UPDATE_STATUS_ERROR: "Something went wrong while updating status",
};

export const API_URLS = {
  GET_ALL_ORDERS: "/api/v1/auth/all-orders",
  UPDATE_ORDER_STATUS: "/api/v1/auth/order-status",
  GET_PRODUCT_PHOTO: "/api/v1/product/product-photo",
};

const status = [
  "Not Processed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [auth] = useAuth();

  const getOrders = async () => {
    try {
      const { data } = await axios.get(API_URLS.GET_ALL_ORDERS);
      setOrders(data);
    } catch (error) {
      toast.error(ADMIN_ORDERS_STRINGS.FETCH_ORDERS_ERROR);
      console.log(error);
    }
  };

  useEffect(() => {
    if (auth?.token) getOrders();
  }, [auth?.token]);

  const handleChange = async (orderId, value) => {
    try {
      await axios.put(`${API_URLS.UPDATE_ORDER_STATUS}/${orderId}`, {
        status: value,
      });
      getOrders();
    } catch (error) {
      toast.error(ADMIN_ORDERS_STRINGS.UPDATE_STATUS_ERROR);
      console.log(error);
    }
  };
  return (
    <Layout title={"All Orders Data"}>
      <div className="row dashboard">
        <div className="col-md-3">
          <AdminMenu />
        </div>
        <div className="col-md-9" data-testid="admin-orders-list">
          <h1 className="text-center">All Orders</h1>
          {orders?.map((o, i) => {
            return (
              <div
                className="border shadow"
                key={o._id}
                data-testid={`admin-order-item-${i}`}
              >
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Status</th>
                      <th scope="col">Buyer</th>
                      <th scope="col">Date</th>
                      <th scope="col">Payment</th>
                      <th scope="col">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{i + 1}</td>
                      <td>
                        <Select
                          data-testid={`status-${o._id}`}
                          variant="borderless"
                          onChange={(value) => handleChange(o._id, value)}
                          defaultValue={o?.status}
                        >
                          {status.map((s, i) => (
                            <Option key={s} value={s}>
                              {s}
                            </Option>
                          ))}
                        </Select>
                      </td>
                      <td>{o?.buyer?.name}</td>
                      <td>{moment(o?.createAt).fromNow()}</td>
                      <td>{o?.payment.success ? "Success" : "Failed"}</td>
                      <td>{o?.products?.length}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="container">
                  {o?.products?.map((p, i) => (
                    <div className="row mb-2 p-3 card flex-row" key={p._id}>
                      <div className="col-md-4">
                        <img
                          src={`${API_URLS.GET_PRODUCT_PHOTO}/${p._id}`}
                          className="card-img-top"
                          alt={p.name}
                          width="100px"
                          height={"100px"}
                        />
                      </div>
                      <div className="col-md-8">
                        <p>{p.name}</p>
                        <p>{p.description.substring(0, 30)}</p>
                        <p>Price : {p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default AdminOrders;
