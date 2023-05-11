<script lang="ts">
import themeText from "data-text:./theme.css"
import cssText from "data-text:element-plus/dist/index.css"
import cssCustom from "data-text:./index.css"
import type { PlasmoContentScript } from "plasmo"

export const config: PlasmoContentScript = {
  matches: ["https://v.flomoapp.com/*"],
}

export default {
  plasmo: {
    getStyle() {
      const style = document.createElement("style")
      style.textContent = themeText + cssText + cssCustom
      return style
    }
  },
}
</script>

<script lang="ts" setup>
import { ElForm, ElFormItem, ElButton, ElDrawer, ElInput } from 'element-plus'
import { Promotion, DArrowLeft, Switch } from '@element-plus/icons-vue'
import { reactive, ref } from 'vue'
import type { FormInstance } from 'element-plus'
import Text from '../components/Text.vue'
import { describe } from './bot'
import { setOpenAIApiKey, handleInit, store as chatStore, memoLoading, qaChat } from './chat'

const drawer = ref<boolean>(false)


const noKey = ref<boolean>(true)
const formRef = ref<FormInstance>()
const formData = reactive({
  openAIApiKey: ''
})
async function saveKey(formEl: any) {
  await formEl.validate((valid) => {
    if (valid) {
      setOpenAIApiKey(formData.openAIApiKey)
      describe.value = '我会保管好的！'
      noKey.value = false
    }
  })
}

interface Chat {
  text: string
  inversion: boolean
}

const chatHistory = ref<Chat[]>([])

const inputM = ref<string>('')
const messageLoading = ref<boolean>(false)
async function handleMessage() {
  const request = inputM.value
  if (!request) {
    describe.value = '聊点什么~'
    return
  }
  inputM.value = ''
  chatHistory.value.push({
    text: request,
    inversion: false
  })
  messageLoading.value = true
  describe.value = '让我想一下...'
  const response = await qaChat(request)
  describe.value = '聊点什么~'
  chatHistory.value.push({
    text: response,
    inversion: true
  })
  messageLoading.value = false
}
function handleEnter(event: KeyboardEvent) {
  if (event.key === 'Enter' && event.ctrlKey) {
    event.preventDefault()
    handleMessage()
  }
}
</script>

<template>
  <el-button :icon="DArrowLeft" style="position: fixed;bottom: 100px;right: 0;border-radius: 40px 0 0 40px;"
    @click="drawer = true">
    chat
  </el-button>
  <el-drawer v-model="drawer" direction="rtl" size="40%" center :show-close="false">
    <template #header>
      <p>{{describe}}</p>
    </template>
    <template #default>
      <div v-if="!chatStore.memoStore">
        <el-form v-if="noKey" ref="formRef" :model="formData" label-width="0px" status-icon>
          <el-form-item prop="openAIApiKey" :rules="[{ required: true, min: 50, message: '请输入key', trigger: 'blur' }]">
            <div class="flex w-full">
              <el-input v-model="formData.openAIApiKey" placeholder="请输入Openai Key">
              </el-input>
              <el-button type="primary" @click="saveKey(formRef)" style="margin-left: 12px;">
                确定
              </el-button>
            </div>
          </el-form-item>
        </el-form>
        <el-button v-else :icon="Switch" type="primary" @click="handleInit" :loading="memoLoading">memo load</el-button>
      </div>
      <div v-else class="h-full overflow-hidden overflow-y-auto">
        <Text v-for="chat in chatHistory" :key="chat.text" :inversion="chat.inversion" :text="chat.text" />
      </div>
    </template>
    <template #footer v-if="!noKey">
      <div style="display: flex;">
        <el-input placeholder="请输入" v-model="inputM" @@keypress="handleEnter">
        </el-input>
        <el-button :icon="Promotion" @click="handleMessage" :loading="messageLoading" type="primary" style="margin-left: 12px;"></el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style src="element-plus/dist/index.css" />