/**
 * Page Content Routes
 * API endpoints for managing page content that can be controlled from admin dashboard
 */

const express = require('express');
const router = express.Router();
const { PageContent } = require('../models');
const { auth, authorize } = require('../middleware/auth');

// Get all page content (optionally filtered by page identifier)
router.get('/', auth, authorize('admin'), async (req, res) => {
    try {
        const { page, active } = req.query;
        
        const where = {};
        if (page) {
            where.pageIdentifier = page;
        }
        if (active !== undefined) {
            where.isActive = active === 'true';
        }

        const contents = await PageContent.findAll({
            where,
            order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: contents
        });
    } catch (error) {
        console.error('Error fetching page content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch page content',
            error: error.message
        });
    }
});

// Get content for a specific page (public endpoint - no auth required)
router.get('/public/:pageIdentifier', async (req, res) => {
    try {
        const { pageIdentifier } = req.params;
        
        const contents = await PageContent.findAll({
            where: {
                pageIdentifier,
                isActive: true
            },
            order: [['displayOrder', 'ASC']]
        });

        res.json({
            success: true,
            data: contents
        });
    } catch (error) {
        console.error('Error fetching public page content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch page content',
            error: error.message
        });
    }
});

// Get single page content by ID
router.get('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const content = await PageContent.findByPk(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Page content not found'
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error fetching page content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch page content',
            error: error.message
        });
    }
});

// Create new page content
router.post('/', auth, authorize('admin'), async (req, res) => {
    try {
        const { 
            pageIdentifier, 
            sectionIdentifier, 
            title, 
            content, 
            subtitle, 
            metadata, 
            displayOrder, 
            isActive 
        } = req.body;

        // Check if pageIdentifier already exists for this section
        const existing = await PageContent.findOne({
            where: {
                pageIdentifier,
                sectionIdentifier: sectionIdentifier || null
            }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Page content with this identifier and section already exists'
            });
        }

        const newContent = await PageContent.create({
            pageIdentifier,
            sectionIdentifier,
            title,
            content,
            subtitle,
            metadata: metadata || {},
            displayOrder: displayOrder || 0,
            isActive: isActive !== false,
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Page content created successfully',
            data: newContent
        });
    } catch (error) {
        console.error('Error creating page content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create page content',
            error: error.message
        });
    }
});

// Update page content
router.put('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const content = await PageContent.findByPk(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Page content not found'
            });
        }

        const { 
            title, 
            content: contentText, 
            subtitle, 
            metadata, 
            displayOrder, 
            isActive 
        } = req.body;

        await content.update({
            title: title !== undefined ? title : content.title,
            content: contentText !== undefined ? contentText : content.content,
            subtitle: subtitle !== undefined ? subtitle : content.subtitle,
            metadata: metadata !== undefined ? metadata : content.metadata,
            displayOrder: displayOrder !== undefined ? displayOrder : content.displayOrder,
            isActive: isActive !== undefined ? isActive : content.isActive,
            updatedBy: req.user.id
        });

        res.json({
            success: true,
            message: 'Page content updated successfully',
            data: content
        });
    } catch (error) {
        console.error('Error updating page content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update page content',
            error: error.message
        });
    }
});

// Delete page content
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const content = await PageContent.findByPk(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Page content not found'
            });
        }

        await content.destroy();

        res.json({
            success: true,
            message: 'Page content deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting page content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete page content',
            error: error.message
        });
    }
});

// Bulk update page content for a page
router.put('/bulk/:pageIdentifier', auth, authorize('admin'), async (req, res) => {
    try {
        const { pageIdentifier } = req.params;
        const { contents } = req.body;

        if (!Array.isArray(contents) || contents.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Contents array is required'
            });
        }

        // Delete existing content for this page
        await PageContent.destroy({
            where: { pageIdentifier }
        });

        // Create new content entries
        const newContents = await Promise.all(
            contents.map((item, index) => 
                PageContent.create({
                    pageIdentifier,
                    sectionIdentifier: item.sectionIdentifier || null,
                    title: item.title,
                    content: item.content,
                    subtitle: item.subtitle,
                    metadata: item.metadata || {},
                    displayOrder: item.displayOrder !== undefined ? item.displayOrder : index,
                    isActive: item.isActive !== false,
                    createdBy: req.user.id,
                    updatedBy: req.user.id
                })
            )
        );

        res.json({
            success: true,
            message: 'Page content bulk updated successfully',
            data: newContents
        });
    } catch (error) {
        console.error('Error bulk updating page content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk update page content',
            error: error.message
        });
    }
});

// Get all unique page identifiers (for listing pages) - MUST be before /:id route
router.get('/meta/pages', auth, authorize('admin'), async (req, res) => {
    try {
        const pages = await PageContent.findAll({
            attributes: ['pageIdentifier'],
            group: ['pageIdentifier'],
            raw: true
        });

        // Map to readable names
        const pageNames = {
            'welcome-page': 'Welcome Page',
            'about-us': 'About Us',
            'contact-information': 'Contact Information',
            'our-team': 'Our Team',
            'events': 'Events',
            'news': 'News',
            'faqs': 'FAQs',
            'policies': 'Policies',
            'terms-conditions': 'Terms & Conditions',
            'volunteer': 'Volunteer',
            'donations': 'Donations',
            'gallery': 'Gallery',
            'portals': 'Portals',
            'resources': 'Resources'
        };

        const pageList = pages.map(p => ({
            identifier: p.pageIdentifier,
            name: pageNames[p.pageIdentifier] || p.pageIdentifier
        }));

        res.json({
            success: true,
            data: pageList
        });
    } catch (error) {
        console.error('Error fetching page list:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch page list',
            error: error.message
        });
    }
});

module.exports = router;