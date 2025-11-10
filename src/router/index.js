import { createRouter, createWebHashHistory } from 'vue-router'
import LandingPageView from '../views/LandingPageView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DashboardView from '../views/DashboardView.vue';

// 路由守卫
// 如果用户未登录，则重定向到登录页
const requireAuth = (to, from, next) => {
    if (!localStorage.getItem('accessToken')) {
        next({ name: 'Login' }); // 如果没有 token, 跳转到登录页
    } else {
        next(); // 有 token, 放行
    }
};

// "访客" 守卫
// 如果用户已登录，则重定向到后台主页
const requireGuest = (to, from, next) => {
    if (localStorage.getItem('accessToken')) {
        next({ name: 'Dashboard' });
    } else {
        next();
    }
};

const routes = [
    {
        path: '/',
        name: 'Home',
        component: LoginView,
        beforeEnter: requireGuest,
    },
    {
        path: '/p/:slug',
        name: 'landing',
        component: LandingPageView
    },
    // 新增商家后台路由
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
        beforeEnter: requireGuest,
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterView,
        beforeEnter: requireGuest,
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: DashboardView,
        beforeEnter: requireAuth // 在进入此路由前执行 requireAuth 守卫
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router