<script setup>
    import {ref} from 'vue';
    import {useRoute, useRouter} from 'vue-router';
    import {useSessionStore} from '../../../iam/application/session.store.js';
    import {watch} from 'vue';
    import {useI18n} from 'vue-i18n';
    import skycropLogo from '../../../assets/skycrop-logo.png';
    import LanguageSwitcher from './language-switcher.vue';
    const {t} = useI18n();
    const route = useRoute(), router = useRouter(), session = useSessionStore();
    async function logout() { session.logout(); await router.replace('/login'); }
    const menuOpen = ref(false);
    const menuCollapsed = ref(false);
    function toggleMenu() {
        if (window.matchMedia('(max-width: 700px)').matches) menuOpen.value = !menuOpen.value;
        else menuCollapsed.value = !menuCollapsed.value;
    }
    watch(() => route.fullPath, () => { menuOpen.value = false; });

    const items = [
        {label: 'navigation.home', to: '/home'},
        {label: 'navigation.profile', to: '/profiles'},
        {label: 'navigation.plots', to: '/plots'},
        {label: 'navigation.drones', to: '/drones'},
        {label: 'navigation.diagnoses', to: '/diagnoses'},
        {label: 'navigation.reports', to: '/reports'},
        {label: 'navigation.subscriptions', to: '/subscriptions'},
        {label: 'navigation.notifications', to: '/notifications'},
        {label: 'navigation.settings', to: '/settings'}
    ];
</script>

<template>
    <div class="layout-container" :class="{'menu-collapsed': menuCollapsed}">
        <header class="header">
            <pv-toolbar class="app-toolbar">
                <template #start>
                    <button class="menu-toggle" type="button" :aria-label="t('navigation.toggleMenu')" :aria-expanded="menuOpen || !menuCollapsed" aria-controls="main-navigation" @click="toggleMenu">
                        <i class="pi pi-bars" aria-hidden="true"></i>
                    </button>
                    <router-link class="title-skycrop" to="/plots"><img :src="skycropLogo" alt="" class="brand-logo" />SkyCrop</router-link>
                </template>
                <template #end>
                    <div class="account-toolbar"><language-switcher /><router-link to="/profiles" class="account-identity"><i class="pi pi-user" aria-hidden="true"></i><span>{{ session.user?.name }}</span></router-link><button class="logout-button" type="button" @click="logout" :aria-label="t('account.logout')"><i class="pi pi-sign-out" aria-hidden="true"></i></button></div>
                </template>
            </pv-toolbar>
        </header>
        <div class="layout-body">
            <aside id="main-navigation" class="side-bar" :class="{'menu-open': menuOpen}">
                <h2 class="navigation-heading">{{ t('navigation.menuTitle') }}</h2>
                <nav :aria-label="t('navigation.menu')" class="navigation-list">
                    <router-link v-for="item in items" :key="item.label" :to="item.to" class="navigation-item">
                        {{ t(item.label) }}
                    </router-link>
                </nav>
            </aside>
            <main class="layout-content">
                <div class="page-content"><router-view/></div>
                <footer class="app-footer">© {{ new Date().getFullYear() }} GreenTech · SkyCrop</footer>
            </main>
        </div>
    </div>    
</template>