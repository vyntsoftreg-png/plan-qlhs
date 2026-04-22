import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import childrenReducer from './slices/childrenSlice';
import usersReducer from './slices/usersSlice';
import skillsReducer from './slices/skillsSlice';
import plansReducer from './slices/plansSlice';
import evaluationsReducer from './slices/evaluationsSlice';
import templatesReducer from './slices/templatesSlice';
import kindergartenReducer from './slices/kindergartenSlice';
import analyticsReducer from './slices/analyticsSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    children: childrenReducer,
    users: usersReducer,
    skills: skillsReducer,
    plans: plansReducer,
    evaluations: evaluationsReducer,
    templates: templatesReducer,
    kindergarten: kindergartenReducer,
    analytics: analyticsReducer,
    ui: uiReducer,
  },
});

export default store;
