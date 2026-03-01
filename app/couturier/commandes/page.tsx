// app/couturier/commandes/page.tsx
"use client";

import { useEffect, useState } from "react";
import commandesService from "@/services/commandes.service";

interface Order {
  _id: string;
  client_name: string;
  service_type: string;
  date: string;
  status: string;
}

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await commandesService.getMine();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await commandesService.updateStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Chargement des commandes...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Commandes</h1>
      {orders.length === 0 ? <p>Aucune commande pour le moment.</p> : (
        <table className="w-full table-auto bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">Service</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} className="border-b">
                <td className="px-4 py-2">{order.client_name}</td>
                <td className="px-4 py-2">{order.service_type}</td>
                <td className="px-4 py-2">{new Date(order.date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{order.status}</td>
                <td className="px-4 py-2 space-x-2">
                  {["PLANNED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"].map(status => (
                    <button
                      key={status}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      onClick={() => handleStatusChange(order._id, status)}
                    >
                      {status}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}