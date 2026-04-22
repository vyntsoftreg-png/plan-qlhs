import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarCollapsed: false,
  theme: 'light',
  notifications: [],
  modals: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    openModal: (state, action) => {
      const { name } = action.payload;
      state.modals[name] = true;
    },
    closeModal: (state, action) => {
      const { name } = action.payload;
      state.modals[name] = false;
    },
  },
});

export const { toggleSidebar, setTheme, addNotification, removeNotification, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
