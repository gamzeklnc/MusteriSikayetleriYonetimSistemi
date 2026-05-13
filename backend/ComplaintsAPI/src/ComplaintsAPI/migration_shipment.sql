BEGIN TRANSACTION;
GO

CREATE TABLE [ShipmentCounts] (
    [Id] int NOT NULL IDENTITY,
    [CustomerName] nvarchar(300) NOT NULL,
    [ShipmentDate] datetime2 NOT NULL,
    [ShipmentQuantity] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_ShipmentCounts] PRIMARY KEY ([Id])
);
GO

CREATE INDEX [IX_ShipmentCounts_CustomerName] ON [ShipmentCounts] ([CustomerName]);
GO

CREATE INDEX [IX_ShipmentCounts_ShipmentDate] ON [ShipmentCounts] ([ShipmentDate]);
GO

COMMIT;
GO
