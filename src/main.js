import './style.css';
import Alpine from 'alpinejs';
import Sortable from 'sortablejs';
import TurndownService from 'turndown';

window.Alpine = Alpine;

document.addEventListener('alpine:init', () => {
    Alpine.data('pageEditor', () => ({
        blocks: [],
        selectedBlock: null,
        activeImageBlockId: null,
        turndown: new TurndownService(),
        previewActive: false,

        init() {
            // Initialize Sortable for the main content area
            new Sortable(this.$refs.mainContent, {
                group: {
                    name: 'blocks',
                    pull: true,
                    put: true,
                },
                animation: 150,
                onAdd: (evt) => {
                    const type = evt.item.dataset.type;
                    const id = `block-${Date.now()}`;

                    // Remove the original dragged item (it's a clone)
                    evt.item.remove();

                    // Add new block to our data
                    this.blocks.push({
                        id,
                        type,
                        content: this.getDefaultContent(type),
                    });
                },
                onEnd: (evt) => {
                    this.updateBlocksOrder();
                },
            });

            // Initialize Sortable for the sidebar blocks
            new Sortable(this.$refs.sidebarBlocks, {
                group: {
                    name: 'blocks',
                    pull: 'clone',
                    put: false,
                },
                sort: false,
                animation: 150,
            });
        },

        updateBlocksOrder() {
            const newBlocks = [];
            const elements = this.$refs.mainContent.children;

            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                if (el.dataset.id) {
                    const block = this.blocks.find((b) => b.id === el.dataset.id);
                    if (block) {
                        newBlocks.push(block);
                    }
                }
            }

            this.blocks = newBlocks;
        },

        getDefaultContent(type) {
            switch (type) {
                case 'heading':
                    return 'New Heading';
                case 'paragraph':
                    return 'New paragraph text';
                case 'image':
                    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzUwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNzUwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjM3NSIgeT0iMjAwIiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q2xpY2sgdG8gc2VsZWN0IGFuIGltYWdlPC90ZXh0Pjwvc3ZnPg==';
                default:
                    return '';
            }
        },

        selectBlock(block) {
            this.selectedBlock = block;
            if (block.type === 'paragraph') {
                // Initialize rich text editor content
                this.$nextTick(() => {
                    const editor = this.$refs.richTextEditor;
                    editor.innerHTML = block.content;
                });
            }
        },

        updateBlockContent(id, content) {
            const block = this.blocks.find((b) => b.id === id);
            if (block) {
                block.content = content;
            }
        },

        moveBlockUp(blockId) {
            const index = this.blocks.findIndex((b) => b.id === blockId);
            if (index > 0) {
                const block = this.blocks[index];
                this.blocks.splice(index, 1);
                this.blocks.splice(index - 1, 0, block);
            }
        },

        moveBlockDown(blockId) {
            const index = this.blocks.findIndex((b) => b.id === blockId);
            if (index < this.blocks.length - 1) {
                const block = this.blocks[index];
                this.blocks.splice(index, 1);
                this.blocks.splice(index + 1, 0, block);
            }
        },

        deleteBlock(blockId) {
            const index = this.blocks.findIndex((b) => b.id === blockId);
            if (index !== -1) {
                this.blocks.splice(index, 1);
                if (this.selectedBlock?.id === blockId) {
                    this.selectedBlock = null;
                }
            }
        },

        triggerImageUpload(blockId) {
            this.activeImageBlockId = blockId;
            this.$refs.imageInput.click();
        },

        async handleImageUpload(event) {
            const input = event.target;
            if (!input.files?.length) return;

            const file = input.files[0];
            const reader = new FileReader();

            reader.onload = async (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate new dimensions maintaining aspect ratio
                    const aspectRatio = img.width / img.height;
                    const newWidth = 750;
                    const newHeight = newWidth / aspectRatio;

                    // Set canvas dimensions
                    canvas.width = newWidth;
                    canvas.height = newHeight;

                    // Draw and resize image
                    ctx?.drawImage(img, 0, 0, newWidth, newHeight);

                    // Convert to base64
                    const resizedImage = canvas.toDataURL('image/jpeg', 0.85);

                    // Update block content
                    const block = this.blocks.find((b) => b.id === this.activeImageBlockId);
                    if (block) {
                        block.content = resizedImage;
                    }
                };
                img.src = e.target?.result;
            };

            reader.readAsDataURL(file);

            // Reset file input
            input.value = '';
        },

        execCommand(command, value) {
            document.execCommand(command, false, value);
            const editor = this.$refs.richTextEditor;
            if (this.selectedBlock) {
                this.selectedBlock.content = editor.innerHTML;
            }
        },

        addLink() {
            const url = prompt('Enter URL:');
            if (url) {
                this.execCommand('createLink', url);
            }
        },

        handleRichTextChange() {
            if (this.selectedBlock) {
                const editor = this.$refs.richTextEditor;
                this.selectedBlock.content = editor.innerHTML;
            }
        },

        save() {
            console.log(this.blocks);
        },

        newDoc() {
            this.blocks = [];
            this.selectedBlock = null;
            this.activeImageBlockId = null;
        },

        preview() {
            this.previewActive = !this.previewActive; // Toggle the previewActive state
            document.querySelectorAll('.content-block').forEach((el) => {
                el.classList.toggle('preview', this.previewActive);
            });
        },
    }));
});

Alpine.start();
