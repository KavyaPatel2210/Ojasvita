import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FoodList = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit & Add State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', category: '', foodType: 'veg' });

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const response = await api.get('/foods-master?limit=1000');
      if (response.data.success) {
        setFoods(response.data.foods);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fats: Number(form.fats)
      };

      if (editingId) {
        await api.put(`/foods-master/${editingId}`, data);
      } else {
        await api.post('/foods-master', data);
      }
      
      setShowModal(false);
      setEditingId(null);
      setForm({ name: '', calories: '', protein: '', carbs: '', fats: '', category: '', foodType: 'veg' });
      fetchFoods();
    } catch (err) {
      alert('Error saving food data');
      console.error(err);
    }
  };

  const handleEdit = (food) => {
    setForm({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      category: food.category,
      foodType: food.foodType
    });
    setEditingId(food._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this food?')) return;
    setFoods(prev => prev.filter(f => f._id !== id)); // Optimistic UI update
    try {
      await api.delete(`/foods-master/${id}`);
      fetchFoods();
    } catch (err) {
      alert('Error deleting food');
      console.error(err);
      fetchFoods(); // Revert on failure
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Food Master List</h1>
        <button 
          onClick={() => {
            setEditingId(null);
            setForm({ name: '', calories: '', protein: '', carbs: '', fats: '', category: '', foodType: 'veg' });
            setShowModal(true);
          }}
          className="btn-primary"
        >
          + Add New Food
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Food Name</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Category</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm pl-4">Macros / 100g</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {foods.map(food => (
                  <tr key={food._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{food.name}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${food.foodType === 'veg' ? 'bg-green-100 text-green-700' : food.foodType === 'egg' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {food.foodType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{food.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <div className="text-center"><p className="font-bold text-gray-900">{food.calories}</p><p className="text-[10px] text-gray-400 font-bold uppercase">cal</p></div>
                        <div className="text-center"><p className="font-bold text-gray-900">{food.protein}g</p><p className="text-[10px] text-gray-400 font-bold uppercase">pro</p></div>
                        <div className="text-center"><p className="font-bold text-gray-900">{food.carbs}g</p><p className="text-[10px] text-gray-400 font-bold uppercase">carb</p></div>
                        <div className="text-center"><p className="font-bold text-gray-900">{food.fats}g</p><p className="text-[10px] text-gray-400 font-bold uppercase">fat</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(food)} className="text-blue-500 hover:text-blue-700 px-3 font-medium">Edit</button>
                      <button onClick={() => handleDelete(food._id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {foods.length === 0 && <div className="p-8 text-center text-gray-500">No foods added yet.</div>}
          </div>
        </div>
      )}

      {/* Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Food' : 'Add Food'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input required name="name" value={form.name} onChange={handleChange} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <input required name="category" value={form.category} onChange={handleChange} className="input-field" placeholder="e.g. Breakfast" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select name="foodType" value={form.foodType} onChange={handleChange} className="input-field">
                    <option value="veg">Veg</option>
                    <option value="egg">Egg</option>
                    <option value="nonveg">Non-Veg</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Calories</label><input required type="number" name="calories" value={form.calories} onChange={handleChange} className="input-field" /></div>
                <div><label className="label">Protein (g)</label><input required type="number" name="protein" value={form.protein} onChange={handleChange} className="input-field" /></div>
                <div><label className="label">Carbs (g)</label><input required type="number" name="carbs" value={form.carbs} onChange={handleChange} className="input-field" /></div>
                <div><label className="label">Fats (g)</label><input required type="number" name="fats" value={form.fats} onChange={handleChange} className="input-field" /></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodList;
