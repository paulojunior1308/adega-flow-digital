"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.offerController = exports.toggleActive = exports.remove = exports.update = exports.create = exports.getById = exports.getAll = void 0;
const OfferService = __importStar(require("../services/offer"));
const getAll = async (req, res) => {
    const offers = await OfferService.getAll();
    res.json(offers);
};
exports.getAll = getAll;
const getById = async (req, res) => {
    const { id } = req.params;
    const offer = await OfferService.getById(id);
    if (!offer)
        return res.status(404).json({ error: 'Oferta não encontrada' });
    res.json(offer);
};
exports.getById = getById;
const create = async (req, res) => {
    const data = req.body;
    const offer = await OfferService.create(data);
    res.status(201).json(offer);
};
exports.create = create;
const update = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const offer = await OfferService.update(id, data);
    res.json(offer);
};
exports.update = update;
const remove = async (req, res) => {
    const { id } = req.params;
    await OfferService.remove(id);
    res.status(204).send();
};
exports.remove = remove;
const toggleActive = async (req, res) => {
    const { id } = req.params;
    const offer = await OfferService.toggleActive(id);
    res.json(offer);
};
exports.toggleActive = toggleActive;
exports.offerController = {
    getAll: exports.getAll,
    getById: exports.getById,
    create: exports.create,
    update: exports.update,
    remove: exports.remove,
    toggleActive: exports.toggleActive
};
