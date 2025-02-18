const { SlashCommandBuilder } = require('discord.js');
const { HfInference } = require('@huggingface/inference');
const os = require('os');
const chatCommand = require('./chat');

// Mock Discord interaction
const mockInteraction = {
    deferReply: jest.fn(),
    editReply: jest.fn(),
    options: {
        getString: jest.fn()
    }
};

describe('Chat Command Tests', () => {
    // System Requirements Check
    describe('System Requirements', () => {
        test('has sufficient memory', () => {
            const totalMemory = os.totalmem() / (1024 * 1024 * 1024); // Convert to GB
            const freeMemory = os.freemem() / (1024 * 1024 * 1024);
            
            console.log(`Total Memory: ${totalMemory.toFixed(2)}GB`);
            console.log(`Free Memory: ${freeMemory.toFixed(2)}GB`);
            
            expect(freeMemory).toBeGreaterThan(2); // Minimum 2GB free
        });

        test('has internet connection', async () => {
            try {
                const response = await fetch('https://api-inference.huggingface.co/');
                expect(response.status).not.toBe(undefined);
            } catch (error) {
                fail('No internet connection to HuggingFace API');
            }
        });
    });

    // Command Structure Tests
    describe('Command Structure', () => {
        test('has required properties', () => {
            expect(chatCommand.data).toBeInstanceOf(SlashCommandBuilder);
            expect(typeof chatCommand.execute).toBe('function');
        });

        test('has required options', () => {
            const options = chatCommand.data.options;
            expect(options.find(o => o.name === 'message')).toBeTruthy();
            expect(options.find(o => o.name === 'model')).toBeTruthy();
        });
    });

    // Model Accessibility Tests
    describe('Model Accessibility', () => {
        const testModels = {
            indo: 'indolem/indobert-base-uncased',
            roberta: 'w11wo/indonesian-roberta-base',
            multi: 'xlm-roberta-base'
        };

        beforeEach(() => {
            mockInteraction.deferReply.mockClear();
            mockInteraction.editReply.mockClear();
        });

        Object.entries(testModels).forEach(([key, model]) => {
            test(`can access ${model}`, async () => {
                const hf = new HfInference(process.env.HF_TOKEN);
                
                mockInteraction.options.getString.mockImplementation((name) => {
                    if (name === 'message') return 'Test message';
                    if (name === 'model') return key;
                });

                const startTime = Date.now();
                
                try {
                    await chatCommand.execute(mockInteraction);
                    const responseTime = Date.now() - startTime;
                    
                    console.log(`${model} response time: ${responseTime}ms`);
                    expect(responseTime).toBeLessThan(30000); // 30s timeout
                    expect(mockInteraction.editReply).toHaveBeenCalled();
                } catch (error) {
                    console.error(`Failed to access ${model}:`, error);
                    fail(`Model ${model} is not accessible`);
                }
            }, 35000); // Timeout after 35s
        });
    });

    // Error Handling Test
    test('handles invalid model gracefully', async () => {
        mockInteraction.options.getString.mockImplementation((name) => {
            if (name === 'message') return 'Test';
            if (name === 'model') return 'invalid_model';
        });

        await chatCommand.execute(mockInteraction);
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            expect.stringContaining('Maaf, terjadi kesalahan')
        );
    });
});