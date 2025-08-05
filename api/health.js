module.exports = (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Multiplayer Tetris Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
};
