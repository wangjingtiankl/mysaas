<template>
  <div>
    <h2>商家注册</h2>
    <form @submit.prevent="handleRegister">
      <input v-model="name" type="text" placeholder="店铺名称" required>
      <input v-model="username" type="text" placeholder="用户名" required>
      <input v-model="password" type="password" placeholder="密码" required>
      <button type="submit">注册</button>
    </form>
    <p v-if="error">{{ error }}</p>
    <p>已有账号？<router-link to="/login">立即登录</router-link></p>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
const router = useRouter();
const name = ref('');
const username = ref('');
const password = ref('');
const error = ref('');
const handleRegister = async () => {
  try {
    await axios.post('https://1259010340-65dsv2iaxk.ap-chengdu.tencentscf.com/auth/register', {
      name: name.value,
      username: username.value,
      password: password.value,
    });
    router.push('/login');
  } catch (err) {
    error.value = err.response?.data?.error || '注册失败，请稍后再试。';
  }
};
</script>