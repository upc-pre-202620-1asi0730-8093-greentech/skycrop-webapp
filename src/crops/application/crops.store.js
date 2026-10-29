
import {defineStore} from 'pinia';
import {ref, shallowRef} from 'vue';
import {CropsApi} from '../infrastructure/crops-api.js';
import {CropAssembler} from '../infrastructure/crop.assembler.js';
import {Crop} from '../domain/model/crop.entity.js';

export const useCropsStore = defineStore('crops', () => {
    const api = new CropsApi();

    const crops = shallowRef([]);
    const selectedCrop = shallowRef(null);
    const loading = ref(false);
    const saving = ref(false);
    const error = ref('');
    const notFound = ref(false);

    async function fetchCrops() {
        loading.value = true;
        error.value = '';

        try {
            crops.value = CropAssembler.toEntitiesFromResponse(
                await api.getAll()
            );
        } catch {
            error.value = 'Unable to load crops.';
        } finally {
            loading.value = false;
        }
    }

    async function fetchCrop(id) {
        loading.value = true;
        error.value = '';
        notFound.value = false;
        selectedCrop.value = null;

        try {
            const response = await api.getById(id);
            selectedCrop.value = CropAssembler.toEntityFromResource(
                response.data
            );
        } catch (err) {
            if (err.response?.status === 404) {
                notFound.value = true;
            } else {
                error.value = 'Unable to load crop details.';
            }
        } finally {
            loading.value = false;
        }
    }

    async function registerCrop(attributes) {
        if (saving.value) return null;

        saving.value = true;
        error.value = '';

        try {
            const crop = new Crop(attributes);
            const response = await api.create(
                CropAssembler.toResourceFromEntity(crop)
            );

            const savedCrop = CropAssembler.toEntityFromResource(
                response.data
            );

            crops.value = [...crops.value, savedCrop];

            return savedCrop;
        } catch {
            error.value = 'Unable to register crop.';
            return null;
        } finally {
            saving.value = false;
        }
    }

    async function updateCrop(id, attributes) {
        if (saving.value) return null;

        saving.value = true;
        error.value = '';

        try {
            const crop = new Crop({
                ...attributes,
                id
            });

            const response = await api.update(
                id,
                CropAssembler.toResourceFromEntity(crop)
            );

            const updatedCrop = CropAssembler.toEntityFromResource(
                response.data
            );

            selectedCrop.value = updatedCrop;

            crops.value = crops.value.map(existingCrop =>
                String(existingCrop.id) === String(updatedCrop.id)
                    ? updatedCrop
                    : existingCrop
            );

            return updatedCrop;
        } catch {
            error.value = 'Unable to update crop.';
            return null;
        } finally {
            saving.value = false;
        }
    }

    return {
        crops,
        selectedCrop,
        loading,
        saving,
        error,
        notFound,
        fetchCrops,
        fetchCrop,
        registerCrop,
        updateCrop
    };
});
