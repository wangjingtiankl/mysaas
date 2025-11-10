import { createRouter, createWebHashHistory } from 'vue-router'
import LandingPageView from '../views/LandingPageView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DashboardView from '../views/DashboardView.vue';

// 路由守卫
const requireAuth = (to, from, next) => {
    if (!localStorage.getItem('accessToken')) {
        next({ name: 'Login' }); // 如果没有 token, 跳转到登录页
    } else {
        next(); // 有 token, 放行
    }
};

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView
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
        component: LoginView
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterView
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