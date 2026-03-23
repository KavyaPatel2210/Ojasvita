/**
 * Ojasvita - Meals Page
 * Meal logging and meal planning with dual calorie tracking
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mealsAPI, foodMasterAPI, mealsBulkAPI, mealPlanAPI } from '../services/api';

const Meals = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('log');
  const [meals, setMeals] = useState([]);
  // History tab state
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyMeals, setHistoryMeals] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [groupedHistoryMeals, setGroupedHistoryMeals] = useState({});

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showFoodSelector, setShowFoodSelector] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Meal planning state
  const [mealPlans, setMealPlans] = useState([]);
  const [plannedTotals, setPlannedTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [achievedTotals, setAchievedTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [pendingPlans, setPendingPlans] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showPlanFoodSelector, setShowPlanFoodSelector] = useState(false);
  // Effective (redistribution-adjusted) daily target
  const [effectiveTarget, setEffectiveTarget] = useState(null);
  const [isTargetAdjusted, setIsTargetAdjusted] = useState(false);
  const [baseTarget, setBaseTarget] = useState(null);

  // Food selection state
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [cartCategory, setCartCategory] = useState("normal");
  const [cartMealTime, setCartMealTime] = useState("other");
  const [popupCategory, setPopupCategory] = useState("normal");
  const [popupMealTime, setPopupMealTime] = useState("other");
  const [showGramsPopup, setShowGramsPopup] = useState(false);
  const [selectedFoodForCart, setSelectedFoodForCart] = useState(null);
  const [gramsInput, setGramsInput] = useState("100");

  // Plan cart state
  const [planCart, setPlanCart] = useState([]);
  const [planMealTime, setPlanMealTime] = useState('breakfast');
  const [planScheduledTime, setPlanScheduledTime] = useState('08:00');
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingPlanItem, setEditingPlanItem] = useState(null);
  const [showEditQuantityPopup, setShowEditQuantityPopup] = useState(false);
  const [editQuantityInput, setEditQuantityInput] = useState("100");

  // Past meals selection state
  const [showPastMealsSelector, setShowPastMealsSelector] = useState(false);
  const [pastMeals, setPastMeals] = useState([]);
  const [pastMealsLoading, setPastMealsLoading] = useState(false);

  // View only mode for meal plan modal
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);

  // View meal popup state
  const [showViewMealPopup, setShowViewMealPopup] = useState(false);
  const [viewingMealPlan, setViewingMealPlan] = useState(null);

  // Function to open view meal popup
  const openViewMealPopup = (plan) => {
    setViewingMealPlan(plan);
    setShowViewMealPopup(true);
  };

  // Default meal times
  const defaultMealTimes = {
    breakfast: '08:00',
    lunch: '13:00',
    dinner: '20:00'
  };

  const [formData, setFormData] = useState({
    title: '', calories: '', protein: '', carbs: '', fats: '', quantity: '100',
    category: 'normal', mealTime: 'other',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchMeals();
    fetchMealPlans();
    fetchCategories();
    checkPendingPlans();
  }, [selectedDate]);

  // History fetch function
  const fetchHistoryMeals = async () => {
    if (!historyDate) return;
    setHistoryLoading(true);
    try {
      const response = await mealsAPI.getMealsByDate(historyDate);
      if (response.data.success) {
        setHistoryMeals(response.data.meals || []);
        // Group by mealTime, but extract cheat and event into their own groups
        const grouped = response.data.meals.reduce((acc, meal) => {
          let type = meal.mealTime;
          if (meal.category === 'cheat') type = 'cheat';
          else if (meal.category === 'event') type = 'event';
          
          if (!acc[type]) acc[type] = [];
          acc[type].push(meal);
          return acc;
        }, {});
        setGroupedHistoryMeals(grouped);
      }
    } catch (err) {
      console.error('Failed to fetch history meals:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // History delete handler (refresh history)
  const handleHistoryDelete = async (mealId) => {
    if (!window.confirm('Delete this meal?')) return;
    // Optimistic UI update
    setHistoryMeals(prev => prev.filter(m => m._id !== mealId));
    setGroupedHistoryMeals(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = updated[key].filter(m => m._id !== mealId);
      });
      return updated;
    });

    try {
      await mealsAPI.deleteMeal(mealId);
      fetchHistoryMeals(); // Refresh history
    } catch (err) {
      console.error('Failed to delete meal:', err);
      fetchHistoryMeals(); // Revert on error
    }
  };

  // History edit handler (switch to log tab for editing)
  const handleHistoryEdit = (meal) => {
    setEditingMeal(meal);
    setFormData({
      title: meal.title,
      calories: meal.calories.toString(),
      protein: meal.protein?.toString() || '',
      carbs: meal.carbs?.toString() || '',
      fats: meal.fats?.toString() || '',
      quantity: meal.quantity?.toString() || '100',
      category: meal.category,
      mealTime: meal.mealTime,
      date: new Date(meal.date).toISOString().split('T')[0]
    });
    setShowForm(true);
    setActiveTab('log'); // Switch to log for editing
  };

  // History fetch effect
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryMeals();
    }
  }, [activeTab, historyDate]);

  useEffect(() => {
    const interval = setInterval(() => { checkPendingPlans(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMeals = async () => {
    try {
      const response = await mealsAPI.getMealsByDate(selectedDate);
      if (response.data.success) {
        setMeals(response.data.meals || []);
        const totals = response.data.totals || {};
        setAchievedTotals({
          calories: totals.calories || 0,
          protein: totals.totalProtein || 0,
          carbs: totals.totalCarbs || 0,
          fats: totals.totalFats || 0
        });
        // Store effective (redistribution-adjusted) target from server
        if (totals.target) {
          setEffectiveTarget(totals.target);
          setBaseTarget(totals.baseTarget || totals.target);
          setIsTargetAdjusted(totals.isAdjusted || false);
        }
      }
    } catch (err) { console.error('Failed to fetch meals:', err); }
    finally { setLoading(false); }
  };

  const fetchMealPlans = async () => {
    try {
      const response = await mealPlanAPI.getMealPlansByDate(selectedDate);
      if (response.data.success) {
        setMealPlans(response.data.mealPlans || []);
        const planned = response.data.plannedTotals || {};
        setPlannedTotals({
          calories: planned.calories || 0,
          protein: planned.plannedProtein || 0,
          carbs: planned.plannedCarbs || 0,
          fats: planned.plannedFats || 0
        });
      }
    } catch (err) { console.error('Failed to fetch meal plans:', err); }
  };

  const fetchCategories = async () => {
    try {
      const response = await foodMasterAPI.getCategories();
      if (response.data.success) setCategories(response.data.categories || []);
    } catch (err) { console.error('Failed to fetch categories:', err); }
  };

  const checkPendingPlans = async () => {
    try {
      const response = await mealPlanAPI.getPendingMealPlans();
      if (response.data.success && response.data.pendingPlans.length > 0) {
        setPendingPlans(response.data.pendingPlans);
        if (response.data.pendingPlans.length > 0) setShowPendingModal(true);
      }
    } catch (err) { console.error('Failed to check pending plans:', err); }
  };

  const searchFoods = async (query = '', category = '') => {
    setFoodsLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (query) params.search = query;
      if (category) params.category = category;
      const response = await foodMasterAPI.getAllFoods(params);
      if (response.data.success) setFoods(response.data.foods || []);
    } catch (err) { console.error('Failed to search foods:', err); }
    finally { setFoodsLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { searchFoods(searchQuery, selectedCategory); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mealData = {
      title: formData.title,
      calories: parseInt(formData.calories),
      protein: parseFloat(formData.protein) || 0,
      carbs: parseFloat(formData.carbs) || 0,
      fats: parseFloat(formData.fats) || 0,
      quantity: parseFloat(formData.quantity) || 100,
      category: formData.category,
      mealTime: formData.mealTime,
      date: formData.date
    };

    // Optimistic UI Update
    if (editingMeal) {
      setMeals(prev => prev.map(m => m._id === editingMeal._id ? { ...m, ...mealData } : m));
    } else {
      setMeals(prev => [...prev, { ...mealData, _id: 'temp_' + Date.now() }]);
    }
    
    setShowForm(false);
    setEditingMeal(null);

    try {
      if (editingMeal) {
        await mealsAPI.updateMeal(editingMeal._id, mealData);
      } else {
        await mealsAPI.createMeal(mealData);
      }
      
      setFormData({ title: '', calories: '', protein: '', carbs: '', fats: '', category: 'normal', mealTime: 'other', date: new Date().toISOString().split('T')[0] });
      await fetchMeals();
    } catch (err) { 
      console.error('Failed to save meal:', err); 
      await fetchMeals(); // Revert on fail
    }
  };

  const handleEdit = (meal) => {
    setEditingMeal(meal);
    setFormData({
      title: meal.title, calories: meal.calories.toString(),
      protein: meal.protein?.toString() || '', carbs: meal.carbs?.toString() || '',
      fats: meal.fats?.toString() || '', quantity: meal.quantity?.toString() || '100',
      category: meal.category,
      mealTime: meal.mealTime, date: new Date(meal.date).toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (mealId) => {
    if (!window.confirm('Delete this meal?')) return;
    setMeals(prev => prev.filter(m => m._id !== mealId)); // Optimistic UI update
    try { 
      await mealsAPI.deleteMeal(mealId); 
      fetchMeals(); 
    } catch (err) { 
      console.error('Failed to delete meal:', err); 
      fetchMeals(); // Revert on failure
    }
  };

  const openGramsPopup = (food) => {
    setSelectedFoodForCart(food);
    setGramsInput("100");
    setPopupCategory("normal");
    setPopupMealTime("other");
    setShowGramsPopup(true);
  };

  const addToCartWithGrams = () => {
    if (!selectedFoodForCart) return;
    const ratio = (parseFloat(gramsInput) || 100) / 100;
    const cartItem = {
      title: selectedFoodForCart.name,
      caloriesPer100g: selectedFoodForCart.calories,
      proteinPer100g: selectedFoodForCart.protein || 0,
      carbsPer100g: selectedFoodForCart.carbs || 0,
      fatsPer100g: selectedFoodForCart.fats || 0,
      grams: parseFloat(gramsInput) || 100,
      category: popupCategory,
      mealTime: popupMealTime
    };
    setCart(prev => [...prev, cartItem]);
    setShowGramsPopup(false);
    setSelectedFoodForCart(null);
  };

  const removeFromCart = (index) => setCart(prev => prev.filter((_, i) => i !== index));

  const updateCartGrams = (index, grams) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, grams: parseFloat(grams) || 0 } : item));
  };

  const getCartTotals = () => {
    return cart.reduce((acc, item) => {
      const ratio = (item.grams || 100) / 100;
      return {
        calories: acc.calories + (item.caloriesPer100g * ratio),
        protein: acc.protein + (item.proteinPer100g * ratio),
        carbs: acc.carbs + (item.carbsPer100g * ratio),
        fats: acc.fats + (item.fatsPer100g * ratio)
      };
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  const submitCart = async () => {
    if (cart.length === 0) return;
    const mealsData = {
      meals: cart.map(item => {
        const ratio = (item.grams || 100) / 100;
        return {
          title: item.title,
          calories: Math.round(item.caloriesPer100g * ratio),
          protein: Math.round(item.proteinPer100g * ratio * 10) / 10,
          carbs: Math.round(item.carbsPer100g * ratio * 10) / 10,
          fats: Math.round(item.fatsPer100g * ratio * 10) / 10,
          quantity: item.grams || 100,
          category: item.category || cartCategory, 
          mealTime: item.mealTime || cartMealTime, 
          date: selectedDate
        };
      }), date: selectedDate
    };

    // Optimistic UI update
    const optimisticMeals = mealsData.meals.map((m, i) => ({ ...m, _id: 'temp_' + Date.now() + '_' + i }));
    setMeals(prev => [...prev, ...optimisticMeals]);
    
    setCart([]);
    setCartCategory("normal");
    setCartMealTime("other");
    setShowFoodSelector(false);

    try {
      await mealsBulkAPI.createMultipleMeals(mealsData);
      await fetchMeals();
    } catch (err) { 
      console.error('Failed to add meals:', err); 
      await fetchMeals(); // Revert
    }
  };

  const fetchPastMeals = async () => {
    setPastMealsLoading(true);
    try {
      const response = await mealsAPI.getRecentMealSessions();
      if (response.data.success) {
        setPastMeals(response.data.sessions || []);
      }
    } catch (err) { console.error('Failed to fetch past meals:', err); }
    finally { setPastMealsLoading(false); }
  };

  const addPastMealToPlan = (session) => {
    const planItems = session.items.map(item => ({
      title: item.title,
      calories: item.calories,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fats: item.fats || 0,
      quantity: item.quantity || 100
    }));
    setPlanCart(prev => [...prev, ...planItems]);
    setShowPastMealsSelector(false);
  };

  // Meal planning functions
  const addToPlanCartWithGrams = () => {
    if (!selectedFoodForCart) return;
    const ratio = (parseFloat(gramsInput) || 100) / 100;
    const planItem = {
      title: selectedFoodForCart.name,
      calories: Math.round(selectedFoodForCart.calories * ratio),
      protein: Math.round((selectedFoodForCart.protein || 0) * ratio * 10) / 10,
      carbs: Math.round((selectedFoodForCart.carbs || 0) * ratio * 10) / 10,
      fats: Math.round((selectedFoodForCart.fats || 0) * ratio * 10) / 10,
      quantity: parseFloat(gramsInput) || 100
    };
    setPlanCart(prev => [...prev, planItem]);
    setShowGramsPopup(false);
    setSelectedFoodForCart(null);
  };

  const removeFromPlanCart = (index) => setPlanCart(prev => prev.filter((_, i) => i !== index));

  const getPlanCartTotals = () => {
    return planCart.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fats: acc.fats + (item.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  const handleCreateMealPlan = async () => {
    if (planCart.length === 0) { alert('Add at least one item'); return; }
    const planData = { date: selectedDate, mealTime: planMealTime, scheduledTime: planScheduledTime, items: planCart };
    try {
      if (editingPlan) {
        await mealPlanAPI.updateMealPlan(editingPlan._id, planData);
        // If editing a completed plan, refresh meal log too
        if (editingPlan.status === 'completed') {
          fetchMeals();
        }
      } else {
        await mealPlanAPI.createMealPlan(planData);
      }
      setPlanCart([]);
      setEditingPlan(null);
      setShowPlanModal(false);
      fetchMealPlans();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save plan'); }
  };


  const openEditQuantityPopup = (item, index) => {
    setEditingPlanItem({ ...item, index });
    setEditQuantityInput(item.quantity?.toString() || "100");
    setShowEditQuantityPopup(true);
  };

  const updatePlanItemQuantity = () => {
    if (!editingPlanItem) return;
    const newQuantity = parseFloat(editQuantityInput) || 100;
    const ratio = newQuantity / (editingPlanItem.quantity || 100);

    setPlanCart(prev => prev.map((item, i) => {
      if (i === editingPlanItem.index) {
        return {
          ...item,
          quantity: newQuantity,
          calories: Math.round((item.calories * ratio) * 10) / 10,

          protein: Math.round((item.protein * ratio) * 10) / 10,
          carbs: Math.round((item.carbs * ratio) * 10) / 10,
          fats: Math.round((item.fats * ratio) * 10) / 10
        };
      }
      return item;
    }));
    setShowEditQuantityPopup(false);
    setEditingPlanItem(null);
  };


  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await mealPlanAPI.deleteMealPlan(planId);
      fetchMealPlans();
      fetchMeals(); // Refresh meal log as well
    }
    catch (err) { console.error('Failed to delete plan:', err); }
  };


  const handleMarkCompleted = async (planId) => {
    try {
      // Update plan status - backend now automatically creates meal entry
      await mealPlanAPI.updateMealPlanStatus(planId, {
        status: 'completed'
      });

      // Refresh both plans and meals (to see the new auto-logged entry)
      fetchMealPlans();
      fetchMeals();
      setShowPendingModal(false);
    } catch (err) {
      console.error('Failed to complete meal plan:', err);
      alert('Failed to complete meal plan. Please try again.');
    }
  };


  const handleMarkIncomplete = async (planId) => {
    try {
      await mealPlanAPI.updateMealPlanStatus(planId, { status: 'incomplete', actualCalories: 0 });
      fetchMealPlans();
      setShowPendingModal(false);
    } catch (err) { console.error('Failed:', err); }
  };

  const handleClearAllPlans = async () => {
    if (!window.confirm('Clear all meal plans for this day?')) return;
    try {
      await Promise.all(mealPlans.map(plan => mealPlanAPI.deleteMealPlan(plan._id)));
      fetchMealPlans();
      fetchMeals();
    } catch (err) { console.error('Failed to clear plans:', err); }
  };


  const getMealTypeColor = (mealTime) => {
    switch (mealTime) { case 'breakfast': return 'bg-green-50 border-green-200'; case 'lunch': return 'bg-green-50 border-green-200'; case 'dinner': return 'bg-green-50 border-green-200'; default: return 'bg-green-50 border-green-200'; }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'incomplete': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Incomplete</span>;
      case 'skipped': return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Skipped</span>;
      default: return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Planned</span>;
    }
  };

  const isTimePassed = (planDate, scheduledTime) => {
    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduled = new Date(planDate);
    scheduled.setHours(hours, minutes, 0, 0);
    return now > scheduled;
  };

  const getPlanForMealTime = (mealTime) => mealPlans.find(plan => plan.mealTime === mealTime);

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  // Use the server-provided effective target (redistribution-adjusted); fall back to user profile target
  const targetCalories = effectiveTarget ?? (user?.targetDailyCalories || 2000);
  const remaining = targetCalories - totalCalories;
  const cartTotals = getCartTotals();
  const plannedCalories = plannedTotals.calories;
  const achievedCalories = achievedTotals.calories;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
          <p className="text-gray-600">Log meals and plan your day</p>
        </div>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input-field w-auto" />
      </div>

      {/* Tabs */}
  <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('log')} className={`px-4 py-2 font-medium text-sm ${activeTab === 'log' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>📋 Log</button>
        <button onClick={() => setActiveTab('plan')} className={`px-4 py-2 font-medium text-sm ${activeTab === 'plan' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>📅 Plan</button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 font-medium text-sm ${activeTab === 'history' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>📜 History</button>
      </div>

      {/* Pending Plans Modal */}
      {showPendingModal && pendingPlans.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Time to check your meal!</h2>
            <div className="space-y-3 mb-6">
              {pendingPlans.slice(0, 3).map(plan => (
                <div key={plan._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium capitalize">{plan.mealTime}</span>
                    <span className="text-sm text-gray-500">{plan.scheduledTime}</span>
                  </div>
                  <p className="text-sm text-gray-600">{plan.plannedCalories} cal planned</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleMarkCompleted(plan._id)} className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 text-sm">✅ I ate it!</button>
                    <button onClick={() => handleMarkIncomplete(plan._id)} className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 text-sm">❌ Didn't eat</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowPendingModal(false)} className="w-full btn-secondary">Close</button>
          </div>
        </div>
      )}

      {/* Meal Log Tab */}
      {activeTab === 'log' && (
        <>
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Today's Total</p>
                <p className="text-3xl font-bold text-gray-900">{totalCalories} <span className="text-lg font-normal text-gray-500">calories</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Target: {targetCalories} cal
                  {isTargetAdjusted && baseTarget && (
                    <span className="ml-1 text-xs text-orange-600 font-medium">(adjusted from {baseTarget})</span>
                  )}
                </p>
                <p className={`text-lg font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>{remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over`}</p>
              </div>
            </div>
            {/* Redistribution notice banner */}
            {isTargetAdjusted && baseTarget && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  ⚠️ <span className="font-semibold">Calorie adjustment active:</span> You exceeded your target recently. Today's goal is reduced by <span className="font-semibold">{baseTarget - targetCalories} cal</span> to balance it out over 5 days.
                </p>
              </div>
            )}
            <div className="mt-4">
              <div className="progress-bar">
                <div className={`progress-bar-fill ${totalCalories > targetCalories ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${Math.min((totalCalories / targetCalories) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => { setShowFoodSelector(true); searchFoods(); }} className="btn-secondary">+ Add from Food List</button>
            <button onClick={() => { setShowForm(true); setEditingMeal(null); setFormData({ title: '', calories: '', protein: '', carbs: '', fats: '', category: 'normal', mealTime: 'other', date: selectedDate }); }} className="btn-primary">+ Manual Entry</button>
          </div>

          {cart.length > 0 && (
            <div className="card bg-blue-50 border border-blue-200 mt-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-blue-600 font-semibold">Cart ({cart.length} items)</p>
                  <p className="text-2xl font-bold text-blue-900">{cartTotals.calories} <span className="text-sm font-normal">calories</span></p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select 
                    value={cartMealTime} 
                    onChange={(e) => setCartMealTime(e.target.value)} 
                    className="input-field text-sm h-10 w-32 border-blue-200"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snack">Snack</option>
                    <option value="dinner">Dinner</option>
                    <option value="other">Other</option>
                  </select>

                  <select 
                    value={cartCategory} 
                    onChange={(e) => setCartCategory(e.target.value)} 
                    className="input-field text-sm h-10 w-32 border-blue-200"
                  >
                    <option value="normal">Normal</option>
                    <option value="cheat">Cheat Meal</option>
                    <option value="event">Event Meal</option>
                  </select>

                  <button onClick={() => setCart([])} className="btn-secondary text-sm h-10 px-4">Clear</button>
                  <button onClick={submitCart} className="btn-primary text-sm h-10 px-4">Add All</button>
                </div>
              </div>
            </div>
          )}

          {/* Meal Categories Grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Normal Meals Section */}
            <div className="card bg-green-50 border border-green-200 space-y-4">

              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
                <h3 className="text-lg font-semibold text-gray-900">Normal Meals</h3>
                <span className="text-sm text-gray-500">({meals.filter(m => m.category === 'normal').length})</span>
              </div>
              {loading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>
              ) : meals.filter(m => m.category === 'normal').length > 0 ? (
                meals.filter(m => m.category === 'normal').map(meal => (
                  <div key={meal._id} className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-medium text-gray-900">{meal.title}</p>
                        <p className="text-sm text-gray-500 capitalize">{meal.mealTime}</p>
                        <p className="text-sm text-gray-500">{meal.protein}g P • {meal.carbs}g C • {meal.fats}g F</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-900">{meal.calories} cal</span>
                      <button onClick={() => handleEdit(meal)} className="text-gray-400 hover:text-primary-500">✏️</button>
                      <button onClick={() => handleDelete(meal._id)} className="text-gray-400 hover:text-red-500">🗑️</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 bg-white rounded-lg">
                  <p className="text-gray-500 text-sm">No normal meals logged</p>
                </div>
              )}
            </div>

            {/* Event Meals Section */}
            <div className="card bg-green-50 border border-green-200 space-y-4">

              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
                <h3 className="text-lg font-semibold text-gray-900">Event Meals</h3>
                <span className="text-sm text-gray-500">({meals.filter(m => m.category === 'event').length})</span>
              </div>
              {loading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>
              ) : meals.filter(m => m.category === 'event').length > 0 ? (
                meals.filter(m => m.category === 'event').map(meal => (
                  <div key={meal._id} className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-medium text-gray-900">{meal.title}</p>
                        <p className="text-sm text-gray-500 capitalize">{meal.mealTime}</p>
                        <p className="text-sm text-gray-500">{meal.protein}g P • {meal.carbs}g C • {meal.fats}g F</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-900">{meal.calories} cal</span>
                      <button onClick={() => handleEdit(meal)} className="text-gray-400 hover:text-primary-500">✏️</button>
                      <button onClick={() => handleDelete(meal._id)} className="text-gray-400 hover:text-red-500">🗑️</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 bg-white rounded-lg">
                  <p className="text-gray-500 text-sm">No event meals logged</p>
                </div>
              )}
            </div>

            {/* Cheat Meals Section */}
            <div className="card bg-green-50 border border-green-200 space-y-4">

              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
                <h3 className="text-lg font-semibold text-gray-900">Cheat Meals</h3>
                <span className="text-sm text-gray-500">({meals.filter(m => m.category === 'cheat').length})</span>
              </div>
              {loading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>
              ) : meals.filter(m => m.category === 'cheat').length > 0 ? (
                meals.filter(m => m.category === 'cheat').map(meal => (
                  <div key={meal._id} className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-medium text-gray-900">{meal.title}</p>
                        <p className="text-sm text-gray-500 capitalize">{meal.mealTime}</p>
                        <p className="text-sm text-gray-500">{meal.protein}g P • {meal.carbs}g C • {meal.fats}g F</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-900">{meal.calories} cal</span>
                      <button onClick={() => handleEdit(meal)} className="text-gray-400 hover:text-primary-500">✏️</button>
                      <button onClick={() => handleDelete(meal._id)} className="text-gray-400 hover:text-red-500">🗑️</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 bg-white rounded-lg">
                  <p className="text-gray-500 text-sm">No cheat meals logged</p>
                </div>
              )}
            </div>
          </div>


          {/* Empty State - Show only when no meals at all */}
          {!loading && meals.length === 0 && (
            <div className="card text-center py-8 mt-6">
              <p className="text-gray-500 mb-4">No meals logged for this day</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => { setShowFoodSelector(true); searchFoods(); }} className="btn-primary">Add from Food List</button>
                <button onClick={() => setShowForm(true)} className="btn-secondary">Manual Entry</button>
              </div>
            </div>
          )}

        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* History Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Meal History - {new Date(historyDate).toLocaleDateString('en-GB')}</h2>
              <p className="text-gray-600">Browse past meals organized by type</p>
            </div>
            <input
              type="date"
              value={historyDate}
              max={selectedDate} // Can't select future dates beyond today
              onChange={(e) => setHistoryDate(e.target.value)}
              className="input-field w-auto"
            />
          </div>

{historyLoading ? (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading meal history...</p>
            </div>
          ) : Object.keys(groupedHistoryMeals).length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">📜</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No meals found</h3>
              <p className="text-gray-500 mb-4">No meals logged on {new Date(historyDate).toLocaleDateString('en-GB')}</p>
              <p className="text-sm text-gray-400">Try selecting a different date</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {['breakfast', 'lunch', 'dinner', 'snack', 'other', 'cheat', 'event']
                .filter(type => ['breakfast', 'lunch', 'dinner'].includes(type) || (groupedHistoryMeals[type] && groupedHistoryMeals[type].length > 0))
                .map((type) => {
                const typeMeals = groupedHistoryMeals[type] || [];
                const typeTotal = typeMeals.reduce((sum, m) => sum + m.calories, 0);

                return (
                  <div key={type} className="lg:col-span-1 card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-4 p-4 border-b border-blue-100 rounded-t-lg bg-white/50">
                      <div className={`w-3 h-3 rounded-full ${
                        type === 'breakfast' ? 'bg-yellow-500' :
                        type === 'lunch' ? 'bg-orange-500' : 
                        type === 'dinner' ? 'bg-purple-500' :
                        type === 'cheat' ? 'bg-red-500' :
                        type === 'event' ? 'bg-pink-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <h3 className="font-bold text-lg capitalize text-gray-900">
                          {type === 'cheat' ? 'Cheat Meals' : type === 'event' ? 'Event Meals' : type}
                        </h3>
                        <p className="text-sm text-gray-500">{new Date(historyDate).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>

                    {typeMeals.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm font-medium">No {type} meals</p>
                        <p className="text-xs mt-1">0 cal</p>
                      </div>
                    ) : (
                      <div className="space-y-3 p-4">
                        {typeMeals.map((meal) => (
                          <div key={meal._id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate" title={meal.title}>{meal.title}</p>
                                <p className="text-xs text-gray-500">
                                  {meal.quantity || 100}g • {meal.protein?.toFixed(1)}g P • {meal.carbs?.toFixed(1)}g C • {meal.fats?.toFixed(1)}g F
                                </p>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-lg text-gray-900">{meal.calories} cal</p>
                            </div>
                          </div>
                        ))}
                        {typeMeals.length > 0 && (
                          <div className="pt-3 border-t border-gray-200 mt-4">
                            <div className="flex justify-between items-center text-sm font-bold text-gray-900 bg-gray-50 p-3 rounded-lg">
                              <span>Total ({typeMeals.length} items)</span>
                              <span>{typeTotal} cal</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Meal Plan Tab */}
      {activeTab === 'plan' && (
        <>

          {/* Triple Calorie Meters - Added Target Calories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-green-50 border border-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-green-600 font-semibold">Planned Calories</p>
                  <p className="text-3xl font-bold text-green-900">{plannedCalories} <span className="text-lg font-normal">cal</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">{mealPlans.length} meals planned</p>
                </div>
              </div>
            </div>
            <div className="card bg-green-50 border border-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-green-600 font-semibold">Target Calories</p>
                  <p className="text-3xl font-bold text-green-900">{targetCalories} <span className="text-lg font-normal">cal</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">{plannedCalories > 0 ? `${Math.round((plannedCalories / targetCalories) * 100)}% planned` : 'No plans yet'}</p>
                </div>
              </div>
            </div>
            <div className="card bg-green-50 border border-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-green-600 font-semibold">Achieved Calories</p>
                  <p className="text-3xl font-bold text-green-900">{achievedCalories} <span className="text-lg font-normal">cal</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">{plannedCalories > 0 ? `${Math.round((achievedCalories / plannedCalories) * 100)}% of planned` : 'No plans yet'}</p>
                </div>
              </div>
            </div>
          </div>


          <button onClick={() => { setShowPlanModal(true); setPlanCart([]); setPlanMealTime('breakfast'); setPlanScheduledTime('08:00'); }} className="btn-primary">+ Plan a Meal</button>

          {/* Meal Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['breakfast', 'lunch', 'dinner'].map(mealTime => {
              const plan = getPlanForMealTime(mealTime);
              const timePassed = plan ? isTimePassed(plan.date, plan.scheduledTime) : false;
              return (
                <div key={mealTime} className={`card border-2 ${getMealTypeColor(mealTime)}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold capitalize text-gray-900">{mealTime}</h3>
                    {plan && getStatusBadge(plan.status)}
                  </div>
                  {plan ? (
                    <>
                      <p className="text-sm text-gray-500 mb-2">⏰ {plan.scheduledTime}</p>
                      <p className="text-lg font-bold text-gray-900 mb-1">{plan.plannedCalories} cal</p>
                      <p className="text-sm text-gray-500 mb-3">{plan.items?.length || 0} items</p>
                      <button
                        onClick={() => openViewMealPopup(plan)}
                        className="w-full bg-teal-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-teal-600 mb-3"
                      >
                        View Plan
                      </button>

                      {plan.status === 'planned' && timePassed && (

                        <div className="flex gap-2 mb-3">
                          <button onClick={() => handleMarkCompleted(plan._id)} className="flex-1 bg-green-500 text-white py-1 px-2 rounded text-sm">✅ I ate it!</button>
                          <button onClick={() => handleMarkIncomplete(plan._id)} className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-sm">❌ Didn't eat</button>
                        </div>
                      )}
                      {plan.status !== 'completed' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingPlan(plan);
                              setPlanMealTime(mealTime);
                              setPlanScheduledTime(plan.scheduledTime);
                              setPlanCart(plan.items || []);
                              setShowPlanModal(true);
                            }}
                            className="flex-1 bg-blue-500 text-white py-1 px-2 rounded text-sm hover:bg-blue-600"
                          >
                            Edit Plan
                          </button>

                          <button onClick={() => handleDeletePlan(plan._id)} className="bg-red-100 text-red-600 text-sm px-3 py-1 rounded hover:bg-red-200">Delete</button>

                        </div>
                      )}

                    </>
                  ) : (
                    <>
                      <p className="text-gray-400 text-sm mb-3">No meal planned</p>
                      <button
                        onClick={() => {
                          setEditingPlan(null);
                          setPlanMealTime(mealTime);
                          setPlanScheduledTime(defaultMealTimes[mealTime] || '08:00');
                          setPlanCart([]);
                          setShowPlanModal(true);
                        }}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-600"
                      >
                        + Add Plan
                      </button>

                    </>
                  )}
                </div>
              );
            })}
          </div>

        </>
      )}

      {/* Food Selector Modal */}
      {showFoodSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Select Foods</h2>
              <button onClick={() => setShowFoodSelector(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input type="text" placeholder="Search foods..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field flex-1" />
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-field w-full sm:w-48">
                <option value="">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {foodsLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>
              ) : foods.length > 0 ? (
                foods.map(food => (
                  <div key={food._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{food.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${food.foodType === 'veg' ? 'bg-green-100 text-green-800' : food.foodType === 'egg' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{food.foodType}</span>
                      </div>
                      <p className="text-sm text-gray-500">{food.calories} cal • {food.protein}g P • {food.carbs}g C • {food.fats}g F <span className="text-xs text-gray-400">(per 100g)</span></p>
                    </div>
                    <button onClick={() => openGramsPopup(food)} className="btn-primary py-2 px-4 ml-4">Add</button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No foods found</div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="font-semibold">Cart: {cart.length} items ({cartTotals.calories} cal)</p>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <select 
                      value={cartMealTime} 
                      onChange={(e) => setCartMealTime(e.target.value)} 
                      className="input-field text-sm h-10 w-32 border-blue-200"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="snack">Snack</option>
                      <option value="dinner">Dinner</option>
                      <option value="other">Other</option>
                    </select>

                    <select 
                      value={cartCategory} 
                      onChange={(e) => setCartCategory(e.target.value)} 
                      className="input-field text-sm h-10 w-32 border-blue-200"
                    >
                      <option value="normal">Normal</option>
                      <option value="cheat">Cheat Meal</option>
                      <option value="event">Event Meal</option>
                    </select>

                    <button onClick={submitCart} className="btn-primary">Add All</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grams Popup */}
      {showGramsPopup && selectedFoodForCart && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Add {selectedFoodForCart.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedFoodForCart.calories} cal • {selectedFoodForCart.protein}g P • {selectedFoodForCart.carbs}g C • {selectedFoodForCart.fats}g F (per 100g)</p>
            <div className="mb-4">
              <label className="label">Enter Grams</label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" value={gramsInput} onChange={(e) => setGramsInput(e.target.value)} className="input-field flex-1" placeholder="100" />
                <span className="text-gray-500 font-medium">g</span>
              </div>
              <p className="text-sm text-gray-600 mt-2 mb-2">Calculated: <span className="font-semibold">{Math.round(selectedFoodForCart.calories * ((parseFloat(gramsInput) || 0) / 100))} calories</span></p>

              {activeTab !== 'plan' && (
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <label className="label">Meal Time</label>
                    <select value={popupMealTime} onChange={(e) => setPopupMealTime(e.target.value)} className="input-field text-sm">
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="snack">Snack</option>
                      <option value="dinner">Dinner</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="label">Category</label>
                    <select value={popupCategory} onChange={(e) => setPopupCategory(e.target.value)} className="input-field text-sm">
                      <option value="normal">Normal</option>
                      <option value="cheat">Cheat Meal</option>
                      <option value="event">Event Meal</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowGramsPopup(false); setSelectedFoodForCart(null); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => activeTab === 'plan' ? addToPlanCartWithGrams() : addToCartWithGrams()} className="btn-primary flex-1">Add to {activeTab === 'plan' ? 'Plan' : 'Cart'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Meal Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingPlan ? 'Edit Meal Plan' : 'Plan a Meal'}</h2>


            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Meal Time</label>
                <select value={planMealTime} onChange={(e) => { setPlanMealTime(e.target.value); setPlanScheduledTime(defaultMealTimes[e.target.value] || '08:00'); }} className="input-field">
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <div>
                <label className="label">Scheduled Time</label>
                <input type="time" value={planScheduledTime} onChange={(e) => setPlanScheduledTime(e.target.value)} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => { setShowPlanFoodSelector(true); searchFoods(); }}
                className="btn-secondary"
              >
                + Add from Food List
              </button>
              <button
                onClick={() => { setShowPastMealsSelector(true); fetchPastMeals(); }}
                className="bg-amber-100 text-amber-700 py-2 px-4 rounded-lg font-medium hover:bg-amber-200 transition-colors"
              >
                🕒 From Past Meals
              </button>
            </div>

            {planCart.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold mb-2">Planned Items ({planCart.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {planCart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="flex-1 truncate">{item.title}</span>
                      <span className="text-sm text-gray-500">{item.quantity || 100}g</span>
                      <span className="mx-2">{Math.round(item.calories || 0)} cal</span>
                      <button onClick={() => openEditQuantityPopup(item, index)} className="text-blue-500 mr-2" title="Edit quantity">✏️</button>
                      <button onClick={() => removeFromPlanCart(index)} className="text-red-500">✕</button>
                    </div>
                  ))}
                </div>
                <p className="text-right font-bold mt-2">Total: {getPlanCartTotals().calories} cal</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowPlanModal(false); setPlanCart([]); setEditingPlan(null); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreateMealPlan} className="btn-primary flex-1">{editingPlan ? 'Update Plan' : 'Create Plan'}</button>
            </div>

          </div>
        </div>
      )}

      {/* Past Meals Selector */}
      {showPastMealsSelector && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recorded Normal Meals</h3>
              <button onClick={() => setShowPastMealsSelector(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <p className="text-sm text-gray-500 mb-4">Select from meals you've eaten recently to add them to your plan.</p>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {pastMealsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : pastMeals.length > 0 ? (
                pastMeals.map((session, idx) => (
                  <div key={idx} className="p-4 border rounded-xl hover:border-primary-300 hover:bg-primary-50/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        {session.mealTime}
                      </span>
                      <span className="text-xs text-gray-400">
                        last eaten {new Date(session.lastEaten).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="font-bold text-gray-900 mb-1">
                        {session.items.map(i => i.title).join(' + ')}
                      </p>
                      <ul className="text-sm text-gray-500 space-y-0.5">
                        {session.items.map((item, iIdx) => (
                          <li key={iIdx}>• {item.title}: {item.calories} cal ({item.quantity || 100}g)</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <p className="font-semibold text-gray-900">
                        Total: {session.totalCalories} calories
                      </p>
                      <button
                        onClick={() => addPastMealToPlan(session)}
                        className="bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
                      >
                        Add Whole Meal
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No past complete meals found</div>
              )}
            </div>

            <button
              onClick={() => setShowPastMealsSelector(false)}
              className="w-full btn-secondary"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Plan Food Selector */}
      {showPlanFoodSelector && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Select Foods for Plan</h3>
              <button onClick={() => setShowPlanFoodSelector(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input type="text" placeholder="Search foods..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field flex-1" />
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-field w-full sm:w-48">
                <option value="">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {foodsLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>
              ) : foods.length > 0 ? (
                foods.map(food => (
                  <div key={food._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{food.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${food.foodType === 'veg' ? 'bg-green-100 text-green-800' : food.foodType === 'egg' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{food.foodType}</span>
                      </div>
                      <p className="text-sm text-gray-500">{food.calories} cal • {food.protein}g P • {food.carbs}g C • {food.fats}g F (per 100g)</p>
                    </div>
                      <button onClick={() => { openGramsPopup(food); setShowPlanFoodSelector(false); }} className="btn-primary py-2 px-4 ml-4">Add</button>
                    </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No foods found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Quantity Popup for Plan Items */}
      {showEditQuantityPopup && editingPlanItem && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Edit {editingPlanItem.title}</h3>
            <p className="text-sm text-gray-500 mb-4">Current: {editingPlanItem.quantity || 100}g • {Math.round(editingPlanItem.calories || 0)} cal</p>
            <div className="mb-4">
              <label className="label">New Quantity (grams)</label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" value={editQuantityInput} onChange={(e) => setEditQuantityInput(e.target.value)} className="input-field flex-1" placeholder="100" />
                <span className="text-gray-500 font-medium">g</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">New calories: <span className="font-semibold">
                {Math.round((editingPlanItem.calories / (editingPlanItem.quantity || 100)) * (parseFloat(editQuantityInput) || 0))} cal
              </span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowEditQuantityPopup(false); setEditingPlanItem(null); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={updatePlanItemQuantity} className="btn-primary flex-1">Update</button>
            </div>
          </div>
        </div>
      )}


      {/* Manual Meal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingMeal ? 'Edit Meal' : 'Add New Meal (Manual)'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Meal Title</label>
                <input name="title" value={formData.title} onChange={handleChange} required className="input-field" placeholder="e.g., Chicken Salad" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Calories</label>
                  <input name="calories" type="number" value={formData.calories} onChange={handleChange} required className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="label">Quantity (g)</label>
                  <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} className="input-field" placeholder="100" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Protein (g)</label>
                  <input name="protein" type="number" value={formData.protein} onChange={handleChange} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="label">Carbs (g)</label>
                  <input name="carbs" type="number" value={formData.carbs} onChange={handleChange} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="label">Fats (g)</label>
                  <input name="fats" type="number" value={formData.fats} onChange={handleChange} className="input-field" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="input-field">
                    <option value="normal">Normal</option>
                    <option value="cheat">Cheat Meal</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="label">Meal Time</label>
                  <select name="mealTime" value={formData.mealTime} onChange={handleChange} className="input-field">
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Date</label>
                <input name="date" type="date" value={formData.date} onChange={handleChange} className="input-field" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingMeal(null); }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingMeal ? 'Update' : 'Add'} Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Meal Popup */}
      {showViewMealPopup && viewingMealPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-primary-600 p-6 text-white text-center relative">
              <button
                onClick={() => setShowViewMealPopup(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold capitalize mb-1 font-sans">{viewingMealPlan.mealTime}</h2>
              <p className="text-primary-100 flex items-center justify-center gap-1 text-sm font-medium">
                🕒 Scheduled for {viewingMealPlan.scheduledTime}
              </p>
            </div>

            <div className="p-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Meal Items</h3>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {viewingMealPlan.items && viewingMealPlan.items.length > 0 ? (
                  viewingMealPlan.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center group p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-500 shadow-sm shadow-primary-200"></div>
                        <div>
                          <p className="font-bold text-gray-800 leading-tight">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.quantity || 100}g</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-gray-900">{Math.round(item.calories)} <span className="text-[10px] font-bold text-gray-400 uppercase">cal</span></p>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                          {item.protein || 0}P • {item.carbs || 0}C • {item.fats || 0}F
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <p className="text-sm font-medium italic">No food items listed in this plan</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Planned</p>
                    <p className="text-3xl font-black text-primary-600 leading-none">
                      {viewingMealPlan.plannedCalories} <span className="text-xs font-bold text-primary-400 uppercase">kcal</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowViewMealPopup(false)}
                    className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-100 hover:bg-primary-700 hover:shadow-primary-200 transition-all active:scale-95 transform"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Meals;
