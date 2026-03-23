import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // User Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/admin/analytics');
        if (statsRes.data.success) setStats(statsRes.data.data);
        
        const usersRes = await api.get('/admin/users');
        if (usersRes.data.success) setUsers(usersRes.data.users);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUserClick = async (userId) => {
    setLoadingDetails(true);
    setShowModal(true);
    try {
      const response = await api.get(`/admin/users/${userId}`);
      if (response.data.success) {
        setSelectedUser({ user: response.data.user, meals: response.data.meals });
      }
    } catch (err) {
      console.error('Failed to fetch user details', err);
      alert('Failed to load user details');
      setShowModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-600">Platform Analytics Overview</p>

      {/* 1. Platform Overview */}
      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Platform Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-2">Total Users</p>
          <p className="text-4xl font-black text-blue-900">{stats.platform.totalUsers}</p>
        </div>
        <div className="card bg-green-50 border border-green-200 p-6 rounded-xl">
          <p className="text-sm text-green-600 font-semibold uppercase tracking-wider mb-2">New Users</p>
          <div className="text-green-900 space-y-1">
            <p className="flex justify-between"><span className="text-sm">Today</span><span className="font-bold">{stats.platform.newUsersToday}</span></p>
            <p className="flex justify-between"><span className="text-sm">This Week</span><span className="font-bold">{stats.platform.newUsersWeek}</span></p>
            <p className="flex justify-between"><span className="text-sm">This Month</span><span className="font-bold">{stats.platform.newUsersMonth}</span></p>
          </div>
        </div>
        <div className="card bg-orange-50 border border-orange-200 p-6 rounded-xl">
          <p className="text-sm text-orange-600 font-semibold uppercase tracking-wider mb-2">Active Users</p>
          <div className="text-orange-900 space-y-1">
            <p className="flex justify-between"><span className="text-sm">Daily Active</span><span className="font-bold">{stats.platform.dailyActiveUsers}</span></p>
            <p className="flex justify-between"><span className="text-sm">Weekly Active</span><span className="font-bold">{stats.platform.weeklyActiveUsers}</span></p>
          </div>
        </div>
        <div className="card bg-purple-50 border border-purple-200 p-6 rounded-xl">
          <p className="text-sm text-purple-600 font-semibold uppercase tracking-wider mb-2">Overall Growth Trend</p>
          <p className="text-4xl font-black text-purple-900">+{stats.platform.growthTrend}%</p>
          <p className="text-xs text-purple-700 mt-1">Month-over-month</p>
        </div>
      </div>

      {/* 2. Food Consumption Analytics */}
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">2. Food Consumption Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Most & Least Consumed Foods</h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-600 mb-2">Most Consumed</h4>
              <ul className="space-y-2">
                {stats.food.mostConsumedFoods.map((f, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate pr-2" title={f.name}>{f.name}</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{f.count}</span>
                  </li>
                ))}
                {stats.food.mostConsumedFoods.length === 0 && <li className="text-xs text-gray-500">No data</li>}
              </ul>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-600 mb-2">Least Consumed</h4>
              <ul className="space-y-2">
                {stats.food.leastConsumedFoods.map((f, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate pr-2" title={f.name}>{f.name}</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{f.count}</span>
                  </li>
                ))}
                {stats.food.leastConsumedFoods.length === 0 && <li className="text-xs text-gray-500">No data</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Category Split & Frequent Meals</h3>
          <div className="mb-6">
            <div className="flex h-4 rounded-full overflow-hidden">
              <div style={{width: `${stats.totalMeals ? (stats.food.categorySplit.normal / stats.totalMeals) * 100 : 0}%`}} className="bg-green-500 border-r border-white" title="Healthy/Normal"></div>
              <div style={{width: `${stats.totalMeals ? (stats.food.categorySplit.event / stats.totalMeals) * 100 : 0}%`}} className="bg-blue-500 border-r border-white" title="Event"></div>
              <div style={{width: `${stats.totalMeals ? (stats.food.categorySplit.cheat / stats.totalMeals) * 100 : 0}%`}} className="bg-red-500" title="Cheat"></div>
              {stats.totalMeals === 0 && <div className="w-full bg-gray-200"></div>}
            </div>
            <div className="flex justify-between text-xs mt-2 text-gray-600">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Healthy: {stats.food.categorySplit.normal || 0}</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span> Event: {stats.food.categorySplit.event || 0}</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Cheat: {stats.food.categorySplit.cheat || 0}</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Frequently Logged Meals</h4>
            <div className="flex flex-wrap gap-2">
              {stats.food.frequentlyLoggedMeals.map((f, i) => (
                <span key={i} className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-1 rounded text-xs flex items-center">
                  <span className="truncate max-w-[120px]" title={f.name}>{f.name}</span>
                  <span className="ml-1 text-gray-500 font-bold">({f.count})</span>
                </span>
              ))}
              {stats.food.frequentlyLoggedMeals.length === 0 && <span className="text-xs text-gray-500">No data</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Calorie Behavior Insights */}
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">3. Calorie Behavior Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 p-6 rounded-xl text-center shadow-sm flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-semibold uppercase">Avg Daily Intake</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{stats.calories.avgDailyIntake} <span className="text-lg font-medium text-gray-500">kcal</span></p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-xl text-center shadow-sm flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-semibold uppercase">Exceeding Limits</p>
          <p className="text-3xl font-black text-red-600 mt-2">{stats.calories.percentExceeding}%</p>
          <p className="text-xs text-gray-500 mt-1">of total logged days</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-xl text-center shadow-sm flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-semibold uppercase">Within Limits</p>
          <p className="text-3xl font-black text-green-600 mt-2">{stats.calories.percentWithin}%</p>
          <p className="text-xs text-gray-500 mt-1">of total logged days</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-xl flex flex-col justify-center shadow-sm">
          <p className="text-sm text-gray-500 font-semibold uppercase text-center mb-4">Day-wise Pattern</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Weekdays</span>
              <span className="font-bold text-gray-900">{stats.calories.avgWeekdayCalories} <span className="text-xs font-normal text-gray-500">kcal</span></span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Weekends</span>
              <span className="font-bold text-gray-900">{stats.calories.avgWeekendCalories} <span className="text-xs font-normal text-gray-500">kcal</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. User Engagement Analytics */}
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">4. User Engagement Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl text-center">
          <p className="text-sm text-indigo-600 font-semibold uppercase">Avg User Streak</p>
          <p className="text-3xl font-black text-indigo-900 mt-2">{stats.engagement.avgStreak} <span className="text-lg font-medium text-indigo-700">days</span></p>
        </div>
        <div className="bg-pink-50 border border-pink-200 p-6 rounded-xl text-center">
          <p className="text-sm text-pink-600 font-semibold uppercase">Highest Streak</p>
          <p className="text-3xl font-black text-pink-900 mt-2">{stats.engagement.highestStreak} <span className="text-lg font-medium text-pink-700">days</span></p>
        </div>
        <div className="bg-teal-50 border border-teal-200 p-6 rounded-xl text-center">
          <p className="text-sm text-teal-600 font-semibold uppercase">Daily Activity</p>
          <div className="mt-3 flex justify-center gap-6">
            <div className="bg-white/60 px-3 py-2 rounded-lg">
              <p className="text-2xl font-black text-teal-900">{stats.engagement.dailyActiveUsers}</p>
              <p className="text-xs text-teal-800 font-medium">Active</p>
            </div>
            <div className="bg-white/60 px-3 py-2 rounded-lg">
              <p className="text-2xl font-black text-gray-600">{stats.engagement.dailyInactiveUsers}</p>
              <p className="text-xs text-gray-600 font-medium">Inactive</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center">
          <p className="text-sm text-amber-600 font-semibold uppercase">Retention Rate</p>
          <p className="text-3xl font-black text-amber-900 mt-2">{stats.engagement.retentionRate}%</p>
          <p className="text-xs text-amber-800 mt-1 font-medium">&gt; 30 days active</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Registered Users</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Email</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Age</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Goal</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.age}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${u.dietGoal === 'lose' ? 'bg-orange-100 text-orange-700' : u.dietGoal === 'gain' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                      {u.dietGoal}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleUserClick(u._id)} className="text-primary-600 hover:text-primary-800 font-medium">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="p-8 text-center text-gray-500">No users found.</div>}
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button onClick={() => { setShowModal(false); setSelectedUser(null); }} className="text-gray-500 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>
            ) : selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="min-w-0"><p className="text-xs text-gray-500 font-bold uppercase">Name</p><p className="font-semibold text-gray-900 truncate" title={selectedUser.user.name}>{selectedUser.user.name}</p></div>
                  <div className="min-w-0"><p className="text-xs text-gray-500 font-bold uppercase">Email</p><p className="font-semibold text-gray-900 break-all" title={selectedUser.user.email}>{selectedUser.user.email}</p></div>
                  <div className="min-w-0"><p className="text-xs text-gray-500 font-bold uppercase">Gender</p><p className="font-semibold text-gray-900 capitalize">{selectedUser.user.gender}</p></div>
                  <div className="min-w-0"><p className="text-xs text-gray-500 font-bold uppercase">Age</p><p className="font-semibold text-gray-900">{selectedUser.user.age} yrs</p></div>
                  
                  <div><p className="text-xs text-gray-500 font-bold uppercase">Height</p><p className="font-semibold text-gray-900">{selectedUser.user.height} cm</p></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase">Weight</p><p className="font-semibold text-gray-900">{selectedUser.user.weight} kg</p></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase">BMI</p><p className="font-semibold text-gray-900">{selectedUser.user.bmi} ({selectedUser.user.bmiCategory})</p></div>
                  <div><p className="text-xs text-gray-500 font-bold uppercase">Daily Target</p><p className="font-semibold text-primary-600">{selectedUser.user.targetDailyCalories} kcal</p></div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mt-6 border-b pb-2">Recent Meals Logged</h3>
                <div className="space-y-3">
                  {selectedUser.meals.length === 0 ? (
                    <p className="text-gray-500 text-sm">No meals logged yet.</p>
                  ) : (
                    selectedUser.meals.map(meal => (
                      <div key={meal._id} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200 shadow-sm">
                        <div>
                          <p className="font-medium text-gray-900">{meal.foodName}</p>
                          <p className="text-xs text-gray-500">{new Date(meal.date).toLocaleDateString()} • {meal.quantity}g</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{meal.calories} kcal</p>
                          <p className="text-[10px] text-gray-500">P:{meal.protein} C:{meal.carbs} F:{meal.fats}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
