
import {Crop} from '../domain/model/crop.entity.js';

export class CropAssembler {
    static toEntityFromResource(resource) {
        return new Crop(resource);
    }

    static toResourceFromEntity(entity) {
        const resource = {
            plotId: entity.plotId,
            name: entity.name,
            variety: entity.variety,
            plantingDate: entity.plantingDate,
            expectedHarvest: entity.expectedHarvest,
            status: entity.status,
            plantedAreaHectares: entity.plantedAreaHectares,
            sowingMethod: entity.sowingMethod,
            irrigationType: entity.irrigationType,
            soilType: entity.soilType,
            notes: entity.notes,
            imageUrl: entity.imageUrl,
            growthStage: entity.growthStage,
            idealHumidityMin: entity.idealHumidityMin,
            idealHumidityMax: entity.idealHumidityMax
        };

        if (entity.id !== null) {
            resource.id = entity.id;
        }

        return resource;
    }

    static toEntitiesFromResponse(response) {
        return response.data.map(resource => this.toEntityFromResource(resource));
    }
}
