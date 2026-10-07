import { promises as fs } from "fs"
import path from "path"

const dataDir = path.join(process.cwd(), "assets", "data")
const entityTypes = ["characters", "weapons", "materials", "domains"]
const materials = new Set()

const errors = []
const warnings = []

function error(message) {
    errors.push(message)
}

function warning(message) {
    warnings.push(message)
}

function isValidSlug(value) {
    return typeof value === "string" && /^[a-z0-9-]+$/.test(value)
}

function isPositiveNumber(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0
}

function validateCommonFields(type, directoryId, data) {
    if (typeof data.id !== "string") {
        error(`${type}/${directoryId}: missing id`)
    } else {
        if (data.id !== directoryId) {
            error(
                `${type}/${directoryId}: id "${data.id}" does not match directory name`
            )
        }

        if (!isValidSlug(data.id)) {
            error(`${type}/${directoryId}: invalid id "${data.id}"`)
        }
    }

    if (typeof data.name !== "string" || data.name.trim() === "") {
        error(`${type}/${directoryId}: missing name`)
    }
}

function validateMaterial(id, data) {
    if (!isPositiveInteger(data.rarity)) {
        error(`materials/${id}: `)
    }

    if (typeof data.type !== "string" || !data.type.trim()) {
        error(`materials/${id}: missing type`)
    }

    if (typeof data.source !== "string" || !data.source.trim()) {
        error(`materials/${id}: missing source`)
    }
    if (typeof data.group !== "string" || !data.group.trim()) {
        error(`materials/${id}: missing group`)
    }
}

function validateMaterialCost(type, entityId, location, cost) {
    if (!cost || typeof cost !== "object") {
        error(`${type}/${entityId}/${location}: invalid material cost`);
        return;
    }

    if (typeof cost.id !== "string" || !isValidSlug(cost.id)) {
        error(`${type}/${entityId}/${location}: invalid material id`);
    } else if (!materials.has(cost.id)) {
        error(
            `${type}/${entityId}/${location}: unknown material "${cost.id}"`,
        );
    }

    if (!isPositiveNumber(cost.value)) {
        error(`${type}/${entityId}/${location}: invalid value`);
    }
}

function validateMaterialCosts(type, entityId, blockName, costs) {
    if (!costs || typeof costs !== "object" || Array.isArray(costs)) {
        error(`${type}/${entityId}: invalid ${blockName}`);
        return;
    }

    for (const [level, materialsList] of Object.entries(costs)) {
        if (!Array.isArray(materialsList)) {
            error(
                `${type}/${entityId}/${blockName}/${level}: expected array`,
            );
            continue;
        }

        for (let index = 0; index < materialsList.length; index++) {
            validateMaterialCost(
                type,
                entityId,
                `${blockName}/${level}/${index}`,
                materialsList[index],
            );
        }
    }
}

function validateCharacter(id, data, misc) {
    if (typeof data.attribute !== "string") {
        error(`characters/${id}: missing attribute`);
    }

    if (typeof data.weapon !== "string") {
        error(`characters/${id}: missing weapon`);
    }

    if (typeof data.gender !== "string") {
        error(`characters/${id}: missing gender`);
    }

    if (typeof data.nation !== "string") {
        error(`characters/${id}: missing nation`);
    }

    if (typeof data.class !== "string") {
        error(`characters/${id}: missing class`);
    }

    if (!isPositiveInteger(data.rarity)) {
        error(`characters/${id}: invalid rarity`);
    }

    if (
        typeof data.release !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data.release)
    ) {
        error(`characters/${id}: invalid release date`);
    }

    if (Array.isArray(misc?.attributes) && !misc.attributes.includes(data.attribute)) {
        error(`characters/${id}: unknown attribute "${data.attribute}"`);
    }

    if (Array.isArray(misc?.weapons) && !misc.weapons.includes(data.weapon)) {
        error(`characters/${id}: unknown weapon "${data.weapon}"`);
    }

    if (Array.isArray(misc?.nations) && !misc.nations.includes(data.nation)) {
        error(`characters/${id}: unknown nation "${data.nation}"`);
    }

    if (Array.isArray(misc?.classes) && !misc.classes.includes(data.class)) {
        error(`characters/${id}: unknown class "${data.class}"`);
    }

    validateMaterialCosts(
        "characters",
        id,
        "ascension_materials",
        data.ascension_materials,
    );

    validateMaterialCosts(
        "characters",
        id,
        "skill_materials",
        data.skill_materials,
    );

    validateMaterialCosts(
        "characters",
        id,
        "stats_bonus_materials",
        data.stats_bonus_materials,
    );

    validateMaterialCosts(
        "characters",
        id,
        "inherent_skill_materials",
        data.inherent_skill_materials,
    );
}

function validateWeapon(id, data) {
    if (typeof data.type !== "string" || !data.type.trim()) {
        error(`weapons/${id}: missing type`);
    }

    if (!isPositiveInteger(data.rarity)) {
        error(`weapons/${id}: invalid rarity`);
    }

    if (!isPositiveNumber(data.base_attack)) {
        error(`weapons/${id}: invalid base_attack`);
    }

    if (typeof data.sub_stat !== "string") {
        error(`weapons/${id}: missing sub_stat`);
    }

    if (!isPositiveNumber(data.sub_stat_base)) {
        error(`weapons/${id}: invalid sub_stat_base`);
    }

    validateMaterialCosts(
        "weapons",
        id,
        "ascension_materials",
        data.ascension_materials,
    );
}

function validateDomain(id, data) {
    if (typeof data.type !== "string" || !data.type.trim()) {
        error(`domains/${id}: missing type`);
    }

    if (!isPositiveNumber(data.cost)) {
        error(`domains/${id}: invalid cost`);
    }

    if (!Array.isArray(data.materials) || data.materials.length === 0) {
        error(`domains/${id}: materials must be a non-empty array`);
        return;
    }

    for (let index = 0; index < data.materials.length; index++) {
        const material = data.materials[index];

        if (
            !material ||
            typeof material.id !== "string" ||
            !isValidSlug(material.id)
        ) {
            error(`domains/${id}/materials/${index}: invalid material id`);
            continue;
        }

        if (!materials.has(material.id)) {
            error(
                `domains/${id}/materials/${index}: unknown material "${material.id}"`,
            );
        }

        if (!isPositiveInteger(material.rarity)) {
            error(`domains/${id}/materials/${index}: invalid rarity`);
        }

        if (!isPositiveNumber(material.value)) {
            error(`domains/${id}/materials/${index}: invalid value`);
        }

        if (typeof material.name !== "string" || !material.name.trim()) {
            error(`domains/${id}/materials/${index}: missing name`);
        }
    }
}

async function validateMisc() {
    const filePath = path.join(dataDir, "misc.json");

    if (!(await exists(filePath))) {
        error("misc.json: file not found");
        return null;
    }

    const misc = await readJson(filePath);

    if (!misc) {
        return null;
    }

    const collections = [
        "nations",
        "attributes",
        "classes",
        "weapons",
    ];

    for (const collection of collections) {
        if (!Array.isArray(misc[collection])) {
            error(`misc.${collection}: expected array`);
            continue;
        }

        const values = new Set();

        for (const value of misc[collection]) {
            if (typeof value !== "string" || !value.trim()) {
                error(`misc.${collection}: invalid value`);
            }

            if (values.has(value)) {
                error(`misc.${collection}: duplicate "${value}"`);
            }

            values.add(value);
        }
    }

    return misc;
}

async function exists(filePath) {
    try {
        await fs.access(filePath)
        return true
    } catch {
        return false
    }
}

async function readJson(filePath) {
    try {
        const content = await fs.readFile(filePath, "utf-8")
        return JSON.parse(content)
    } catch (e) {
        error(`Invalid JSON: ${filePath} (${e.message})`)
        return null
    }
}

async function validateEntityDirectories(type, misc) {
    const typeDir = path.join(dataDir, type)

    let entries;

    try {
        entries = await fs.readdir(typeDir, { withFileTypes: true })
    } catch (e) {
        error(`Cannot read type directory "${type}": ${e.message}`)
        return []
    }

    const entities = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()

    for (const id of entities) {
        if (!isValidSlug(id)) {
            error(`${type}/${id}: invalid slug`)
            continue
        }

        const jsonPath = path.join(typeDir, id, `${id}.json`)

        if (!(await exists(jsonPath))) {
            error(`${type}/${id}: missing ${id}.json`)
        }

        const data = await readJson(jsonPath)

        if (!data) {
            continue
        }

        validateCommonFields(type, id, data)

        if (type === "materials") {
            materials.add(id)
            validateMaterial(id, data)
        }

        if (type === "characters") {
            validateCharacter(id, data, misc)
        }

        if (type === "weapons") {
            validateWeapon(id, data);
        }

        if (type === "domains") {
            validateDomain(id, data);
        }
    }

    return entities
}

async function main() {
    console.log("Validating dataset...\n")

    const misc = await validateMisc()

    const counts = {}

    counts.materials = (
        await validateEntityDirectories("materials", misc)
    ).length

    counts.characters = (
        await validateEntityDirectories("characters", misc)
    ).length

    counts.weapons = (
        await validateEntityDirectories("weapons", misc)
    ).length

    counts.domains = (
        await validateEntityDirectories("domains", misc)
    ).length

    console.log("\nResults:")

    for (const [type, count] of Object.entries(counts)) {
        console.log(` ${type}: ${count}`)
    }

    console.log(`\nErrors: ${errors.length}`)
    console.log(`Warnings: ${warnings.length}`)

    if (errors.length > 0) {
        console.log("\nErrors:")

        for (const message of errors) {
            console.log(`  X ${message}`)
        }
    }

    if (warnings.length > 0) {
        console.log("\nWarnings:")

        for (const message of warnings) {
            console.log(`  ! ${message}`)
        }
    }

    if (errors.length > 0) {
        process.exitCode = 1;
        return;
    }

    console.log("\n✓ Dataset is valid");
}

main().catch((err) => {
    console.log(err);
    process.exitCode = 1;
})