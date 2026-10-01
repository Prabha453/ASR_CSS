const slugify = require('slugify');
const { Op } = require('sequelize');

const generateUniqueSlug = async (
    Model,
    text,
    slugField = 'slug_name',
    primaryKey = 'id',
    id = null
) => {

    let slug = slugify(text, {
        lower: true,
        strict: true,
        trim: true,
    });

    let uniqueSlug = slug;
    let count = 1;

    while (true) {

        const where = {
            [slugField]: uniqueSlug,
        };

        // exclude current row during update
        if (id) {
            where[primaryKey] = {
                [Op.ne]: id,
            };
        }

        const existing = await Model.findOne({
            where,
        });

        if (!existing) {
            break;
        }

        uniqueSlug = `${slug}-${count}`;
        count++;
    }

    return uniqueSlug;
};

module.exports = generateUniqueSlug;