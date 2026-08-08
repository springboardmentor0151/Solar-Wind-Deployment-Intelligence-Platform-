import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center text-2xl font-semibold">
          No user logged in.
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-slate-100 min-h-screen p-8">

        <PageHeader
          title="My Profile"
          subtitle="Renewable Energy Deployment Intelligence Platform"
        />

        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-10">

          {/* Profile Header */}

          <div className="flex items-center gap-8">

            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-green-500 to-blue-600 text-white flex items-center justify-center text-5xl font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>

            <div>

              <h1 className="text-4xl font-bold text-gray-800">
                {user.full_name}
              </h1>

              <p className="text-lg text-gray-500 mt-2">
                {user.role}
              </p>

              <span className="inline-block mt-4 bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium">
                Active User
              </span>

            </div>

          </div>

          <hr className="my-10" />

          {/* User Details */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div className="bg-green-50 rounded-2xl p-6 shadow">

              <h3 className="text-gray-500 mb-2">
                Full Name
              </h3>

              <p className="text-xl font-semibold">
                {user.full_name}
              </p>

            </div>

            <div className="bg-blue-50 rounded-2xl p-6 shadow">

              <h3 className="text-gray-500 mb-2">
                Email
              </h3>

              <p className="text-xl font-semibold">
                {user.email}
              </p>

            </div>

            <div className="bg-yellow-50 rounded-2xl p-6 shadow">

              <h3 className="text-gray-500 mb-2">
                Role
              </h3>

              <p className="text-xl font-semibold">
                {user.role}
              </p>

            </div>

            <div className="bg-purple-50 rounded-2xl p-6 shadow">

              <h3 className="text-gray-500 mb-2">
                User ID
              </h3>

              <p className="text-xl font-semibold">
                #{user.id}
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Profile;