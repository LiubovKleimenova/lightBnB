const pool = require('./db_index.js')
/// Users

const getUserWithEmail = function(email) {
  return pool
    .query(
      `
  SELECT * FROM users
  where users.email = $1
  `,
      [email]
    )
    .then(res => res.rows[0]);
}
exports.getUserWithEmail = getUserWithEmail;


const getUserWithId = function(id) {
  return pool
    .query(
      `
  SELECT * FROM users
  where users.id = $1
  `,
      [id]
    )
    .then(res => res.rows[0]);
}
exports.getUserWithId = getUserWithId;



const addUser =  function(user) {
return pool
    .query(
      `
  INSERT into users (name, email, password)
  values ($1, $2, $3)
  RETURNING *
  `,
      [user.name, user.email, user.password]
    )
    .then(res => res.rows[0]);
}
exports.addUser = addUser;

/// Reservations


const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(
      `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = $1
  AND reservations.end_date < now()
::date
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT $2;
  `,
      [guest_id, limit]
    )
    .then(res => res.rows);
}
exports.getAllReservations = getAllReservations;

/// Properties


const getAllProperties = function(options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1=1
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND city ILIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(Number(options.owner_id));
    queryString += `and properties.owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night)*100);
    queryString += `and properties.cost_per_night > $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night)*100);
    queryString += `and properties.cost_per_night < $${queryParams.length} `;
  }

  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    queryString += `and property_reviews.rating > $${queryParams.length} `;
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 6
  return pool.query(queryString, queryParams).then(res => res.rows);
};
exports.getAllProperties = getAllProperties;

const addProperty = function(property) {
  return pool
    .query(
      `
  INSERT into properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code, active)
  values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
  RETURNING *;
  `,
      [
        property.owner_id,
        property.title,
        property.description,
        property.thumbnail_photo_url,
        property.cover_photo_url,
        property.cost_per_night,
        property.parking_spaces,
        property.number_of_bathrooms,
        property.number_of_bedrooms,
        property.country,
        property.street,
        property.city,
        property.province,
        property.post_code
      ]
    )
    .then(res => res.rows[0]);
}
exports.addProperty = addProperty;
