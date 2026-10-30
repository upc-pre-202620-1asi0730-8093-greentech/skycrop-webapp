<script setup>
import {useI18n} from 'vue-i18n';
import PlotsSlider from "../../../plots/presentation/components/plots-slider.vue";
const {t} = useI18n();

</script>




<template>

  <section>
    <h1>Welcome, User</h1>
  </section>


  <section>
    <div>
      <h2>Check on your plots</h2>
      <div>
        <plots-slider/>
      </div>
    </div>
  </section>


  <section>
    <div>
      <h2>Quick Actions</h2>
      <div>
      </div>
    </div>
  </section>


  <section>
    <div>
      <h2>Recent diagnoses</h2>
      <div>
      </div>
    </div>
  </section>
</template>



<style scoped>

</style>