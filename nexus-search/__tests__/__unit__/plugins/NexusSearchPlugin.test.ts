// import { NexusSearchPlugin } from "@/plugins";
// import { IndexedDocument } from "@/types";

// describe("NexusSearchPlugin", () => {
//     let plugin: NexusSearchPlugin;
    
//     // Create properly structured test documents with toObject implementation
//     const createTestDoc = (id: string, title: string, content: string, author: string, tags: string[]): IndexedDocument => ({
//         id,
//         fields: {
//             title,
//             content,
//             author,
//             tags
//         },
//         metadata: {
//             indexed: Date.now(),
//             lastModified: Date.now()
//         },
//         toObject(): IndexedDocument {
//             return this;
//         }
//     });

//     const documents: IndexedDocument[] = [
//         createTestDoc(
//             "1",
//             "Document 1",
//             "This is the content of document 1",
//             "Author 1",
//             ["tag1", "tag2"]
//         ),
//         createTestDoc(
//             "2",
//             "Document 2",
//             "This is the content of document 2",
//             "Author 2",
//             ["tag2", "tag3"]
//         )
//     ];

//     beforeEach(async () => {
//         plugin = new NexusSearchPlugin({ documents });
//         await plugin.initialize();
//     });

//     it("should initialize with documents", async () => {
//         expect(plugin.length).toBe(2);
//     });

//     it("should search documents by query", async () => {
//         const results = await plugin.search("content of document 1");
//         expect(results.length).toBe(1);
//         expect(results[0].fields.title).toBe("Document 1");
//     });

//     it("should search documents by tag", async () => {
//         const results = await plugin.searchByTag("tag2");
//         expect(results.length).toBe(2);
//     });

//     it("should add a new document", async () => {
//         const newDocument = createTestDoc(
//             "3",
//             "Document 3",
//             "This is the content of document 3",
//             "Author 3",
//             ["tag3", "tag4"]
//         );
        
//         await plugin.addDocument(newDocument);
//         const results = await plugin.search("content of document 3");
//         expect(results.length).toBe(1);
//         expect(results[0].fields.title).toBe("Document 3");
//     });

//     it("should remove a document", async () => {
//         await plugin.removeDocument("1");
//         const results = await plugin.search("content of document 1");
//         expect(results.length).toBe(0);
//     });

//     it("should update a document", async () => {
//         const updatedDocument = createTestDoc(
//             "1",
//             "Updated Document 1",
//             "This is the updated content of document 1",
//             "Author 1",
//             ["tag1", "tag2"]
//         );
        
//         await plugin.updateDocument(updatedDocument);
//         const results = await plugin.search("updated content of document 1");
//         expect(results.length).toBe(1);
//         expect(results[0].fields.title).toBe("Updated Document 1");
//     });

//     it("should load and search markdown content", async () => {
//         const markdownContent = "# Markdown Title\nThis is markdown content.";
//         await plugin.loadMarkdown(markdownContent);
//         const results = await plugin.search("markdown content");
//         expect(results.length).toBe(1);
//         expect(results[0].fields.title).toBe("Markdown Title");
//     });

//     it("should load and search HTML content", async () => {
//         const htmlContent = "<h1>HTML Title</h1><p>This is HTML content.</p>";
//         await plugin.loadHTML(htmlContent);
//         const results = await plugin.search("HTML content");
//         expect(results.length).toBe(1);
//         expect(results[0].fields.title).toBe("HTML Title");
//     });

//     it("should search with regex", async () => {
//         const results = await plugin.searchWithRegex("content", /document \d/);
//         expect(results.length).toBe(2);
//     });

//     // Additional test cases for error handling
//     it("should handle invalid document structure", async () => {
//         const invalidDocument = {
//             id: "invalid",
//             fields: {
//                 title: "Invalid Doc"
//                 // Missing required fields
//             }
//         };
        
//         await expect(plugin.addDocument(invalidDocument as IndexedDocument))
//             .rejects
//             .toThrow();
//     });

//     it("should handle document updates with missing ID", async () => {
//         const docWithoutId = createTestDoc(
//             "", // Empty ID
//             "No ID Doc",
//             "Content",
//             "Author",
//             ["tag"]
//         );
        
//         await expect(plugin.updateDocument(docWithoutId))
//             .rejects
//             .toThrow();
//     });

//     it("should handle removal of non-existent document", async () => {
//         await expect(plugin.removeDocument("non-existent-id"))
//             .rejects
//             .toThrow();
//     });
// });