BEGIN TRANSACTION;
GO

ALTER TABLE [Complaints] ADD [JustifiedHsa1Count] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [Complaints] ADD [JustifiedHsa2Count] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [Complaints] ADD [JustifiedOtherCount] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [Complaints] ADD [UnjustifiedHsa1Count] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [Complaints] ADD [UnjustifiedHsa2Count] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [Complaints] ADD [UnjustifiedOtherCount] int NOT NULL DEFAULT 0;
GO

CREATE TABLE [ComplaintBarcodeResults] (
    [Id] int NOT NULL IDENTITY,
    [ComplaintId] int NOT NULL,
    [Barcode] nvarchar(max) NOT NULL,
    [IsJustified] bit NOT NULL,
    CONSTRAINT [PK_ComplaintBarcodeResults] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ComplaintBarcodeResults_Complaints_ComplaintId] FOREIGN KEY ([ComplaintId]) REFERENCES [Complaints] ([Id]) ON DELETE CASCADE
);
GO

UPDATE [Users] SET [CreatedAt] = '2026-03-18T12:25:06.6347128Z', [PasswordHash] = N'$2a$11$uoFSn2vg0jO7ugDh6XTO9OBBXSXXzmVOrffoFnjo9SSaW4xKdRX9i'
WHERE [Id] = 1;
SELECT @@ROWCOUNT;

GO

CREATE INDEX [IX_ComplaintBarcodeResults_ComplaintId] ON [ComplaintBarcodeResults] ([ComplaintId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260318122510_AddJustificationFields', N'8.0.13');
GO

COMMIT;
GO

