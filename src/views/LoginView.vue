<template>
  <div>
    <h2>商家登录</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="username" type="text" placeholder="用户名" required>
      <input v-model="password" type="password" placeholder="密码" required>
      <button type="submit">登录</button>
    </form>
    <p v-if="error">{{ error }}</p>
    <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');

const handleLogin = async () => {
  try {
    const response = await axios.post('https://1259010340-65dsv2iaxk.ap-chengdu.tencentscf.com/auth/login', {
      username: username.value,
      password: password.value,
    });
    localStorage.setItem('accessToken', response.data.accessToken);
    router.push('/dashboard');
  } catch (err) {
    error.value = '登录失败，请检查用户名和密码。';
  }
};
</script>