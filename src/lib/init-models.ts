import mongoose from 'mongoose';
import Bed from '@/models/Bed';
import Room from '@/models/Room';
import Property from '@/models/Property';
import Owner from '@/models/Owner';
import IQProperty from '@/models/IQProperty';

export const initModels = () => {
    // Explicitly reference all models to ensure they are registered with Mongoose
    const models = {
        Bed: mongoose.models.Bed || Bed,
        Room: mongoose.models.Room || Room,
        Property: mongoose.models.Property || Property,
        Owner: mongoose.models.Owner || Owner,
        IQProperty: mongoose.models.IQProperty || IQProperty,
    };
    return models;
};
