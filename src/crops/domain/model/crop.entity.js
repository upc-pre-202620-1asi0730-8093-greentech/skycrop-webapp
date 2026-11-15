
export class Crop {
    #id;
    #plotId;
    #name;
    #variety;
    #plantingDate;
    #expectedHarvest;
    #status;
    #plantedAreaHectares;
    #sowingMethod;
    #irrigationType;
    #soilType;
    #notes;
    #imageUrl;
    #growthStage;
    #idealHumidityMin;
    #idealHumidityMax;

    constructor({
                    id = null,
                    plotId,
                    name,
                    variety,
                    plantingDate,
                    expectedHarvest = null,
                    status = 'ACTIVE',
                    plantedAreaHectares = null,
                    sowingMethod = '',
                    irrigationType = '',
                    soilType = '',
                    notes = '',
                    imageUrl = '',
                    growthStage = '',
                    idealHumidityMin = null,
                    idealHumidityMax = null
                }) {
        if (plotId === null || plotId === undefined || plotId === '') {
            throw new Error('A plot is required.');
        }
        if (typeof name !== 'string' || !name.trim()) {
            throw new Error('A crop name is required.');
        }
        if (typeof variety !== 'string' || !variety.trim()) {
            throw new Error('A crop variety is required.');
        }
        if (!plantingDate) {
            throw new Error('A planting date is required.');
        }
        if (!['ACTIVE', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            throw new Error('The crop status is invalid.');
        }
        if (plantedAreaHectares !== null &&
            (typeof plantedAreaHectares !== 'number' ||
                !Number.isFinite(plantedAreaHectares) ||
                plantedAreaHectares <= 0)) {
            throw new Error('The planted area must be greater than zero.');
        }

        if (typeof growthStage !== 'string') {
            throw new Error('The growth stage must be text.');
        }

        for (const value of [idealHumidityMin, idealHumidityMax]) {
            if (value !== null &&
                (typeof value !== 'number' ||
                    !Number.isFinite(value) ||
                    value < 0 ||
                    value > 100)) {
                throw new Error('The ideal humidity must be between 0 and 100.');
            }
        }

        if (idealHumidityMin !== null &&
            idealHumidityMax !== null &&
            idealHumidityMin > idealHumidityMax) {
            throw new Error('The minimum humidity cannot exceed the maximum.');
        }

        this.#id = id;
        this.#plotId = plotId;
        this.#name = name.trim();
        this.#variety = variety.trim();
        this.#plantingDate = plantingDate;
        this.#expectedHarvest = expectedHarvest;
        this.#status = status;
        this.#plantedAreaHectares = plantedAreaHectares;
        this.#sowingMethod = sowingMethod;
        this.#irrigationType = irrigationType;
        this.#soilType = soilType;
        this.#notes = notes;
        this.#imageUrl = imageUrl;
        this.#growthStage = growthStage.trim();
        this.#idealHumidityMin = idealHumidityMin;
        this.#idealHumidityMax = idealHumidityMax;
    }

    get id() { return this.#id; }
    get plotId() { return this.#plotId; }
    get name() { return this.#name; }
    get variety() { return this.#variety; }
    get plantingDate() { return this.#plantingDate; }
    get expectedHarvest() { return this.#expectedHarvest; }
    get status() { return this.#status; }
    get plantedAreaHectares() { return this.#plantedAreaHectares; }
    get sowingMethod() { return this.#sowingMethod; }
    get irrigationType() { return this.#irrigationType; }
    get soilType() { return this.#soilType; }
    get notes() { return this.#notes; }
    get imageUrl() { return this.#imageUrl; }
    get growthStage() { return this.#growthStage; }
    get idealHumidityMin() { return this.#idealHumidityMin; }
    get idealHumidityMax() { return this.#idealHumidityMax; }
}
