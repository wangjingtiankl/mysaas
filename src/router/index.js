import { createRouter, createWebHashHistory } from 'vue-router'
import LandingPageView from '../views/LandingPageView.vue'
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import MerchantAdminView from '../views/MerchantAdminView.vue';
import MerchantDashboardHomeView from "../views/MerchantDashboardHomeView.vue";

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
        next({ name: 'DashboardHome' });
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
        name: 'DashboardHome',
        component: MerchantDashboardHomeView,
        beforeEnter: requireAuth,
    },
    {
        path: '/admin/page/:slug',
        name: 'MerchantAdmin',
        component: MerchantAdminView,
        beforeEnter: requireAuth // 在进入此路由前执行 requireAuth 守卫
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router