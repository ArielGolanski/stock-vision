const Brokerage = require('../models/brokerage');

exports.getAllBrokerages = async (req, res) => {
    try {
        // Find all brokerages
        const brokerages = await Brokerage.find().select('name');
        
        if (!brokerages || brokerages.length === 0) {
            return res.status(404).json({ message: 'No brokerages found' });
        }

        res.json(brokerages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching brokerages' });
    }
};

