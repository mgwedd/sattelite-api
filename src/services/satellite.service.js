const httpStatus = require('http-status');
const satelliteJS = require('satellite.js');
const mongoose = require('mongoose');

const { Satellite } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a satellite from TLE data
 * @returns {Promise<Satellite>}
 */
const createSatellite = async (requestData) => {
  const { name, tleLineOne, tleLineTwo } = requestData;
  // save the satrec to the satellite doc so that it doesn't
  // need to be recalculated from tle each time we want to use it
  const satrec = satelliteJS.twoline2satrec(tleLineOne, tleLineTwo);
  const satteliteWithSatrec = {
    name,
    tle: {
      lineOne: tleLineOne,
      lineTwo: tleLineTwo,
    },
    satrec,
  };
  const sattelite = await Satellite.create(satteliteWithSatrec);
  return sattelite;
};

/**
 * Bulk create satellites from TLE data
 * @returns {Promise<Array.Satellite>}
 */
const bulkCreateSatellites = async (tles) => {
  // This assumes prelim transformation of the tle data from .txt to an array of TLE objects with name, lineOne, and lineTwo
  const satellites = tles.map(({ name, lineOne, lineTwo }) => {
    const satrec = satelliteJS.twoline2satrec(lineOne, lineTwo);
    return {
      _id: mongoose.Types.ObjectId(),
      name,
      tle: {
        lineOne,
        lineTwo,
      },
      satrec,
    };
  });
  Satellite.insertMany(satellites);
};

/**
 * List satellites
 * @returns {Promise<QueryResult>}
 */
const listSatellites = async () => {
  const satellites = await Satellite.find();
  return satellites;
};

/**
 * Get satellite by id
 * @param {ObjectId} id
 * @returns {Promise<Satellite>}
 */
const getSatelliteById = async (id) => {
  return Satellite.findById(id);
};

/**
 * Update satellite by id
 * @param {ObjectId} id
 * @param {Object} updateBody
 * @returns {Promise<Satellite>}
 */
const updateSatelliteById = async (id, updateBody) => {
  const satellite = await getSatelliteById(id);
  if (!satellite) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Satellite not found');
  }
  const { tleLineOne, tleLineTwo } = updateBody;
  Object.assign(satellite, updateBody);
  // Recalculate the satrec since the request may be to update the TLE data
  satellite.satrec = satelliteJS.twoline2satrec(tleLineOne, tleLineTwo);
  await satellite.save();
  return satellite;
};

/**
 * Delete satellite by id
 * @param {ObjectId} id
 * @returns {Promise<Satellitet>}
 */
const deleteSatelliteById = async (id) => {
  const satellite = await getSatelliteById(id);
  if (!satellite) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Satellite not found');
  }
  await satellite.remove();
  return satellite;
};

module.exports = {
  createSatellite,
  bulkCreateSatellites,
  listSatellites,
  getSatelliteById,
  updateSatelliteById,
  deleteSatelliteById,
};
